import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models.detection import maskrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor
from typing import Dict, List, Tuple, Optional
import numpy as np

class ComponentDetector(nn.Module):
    def __init__(
        self,
        num_classes: int,
        hidden_dim: int = 256,
        pretrained: bool = True
    ):
        super().__init__()
        
        # Load pre-trained model
        self.model = maskrcnn_resnet50_fpn(pretrained=pretrained)
        
        # Replace the pre-trained head with a new one
        in_features = self.model.roi_heads.box_predictor.cls_score.in_features
        self.model.roi_heads.box_predictor = FastRCNNPredictor(
            in_features,
            num_classes
        )
        
        # Replace mask predictor with a new one
        in_features_mask = self.model.roi_heads.mask_predictor.conv5_mask.in_channels
        self.model.roi_heads.mask_predictor = MaskRCNNPredictor(
            in_features_mask,
            hidden_dim,
            num_classes
        )
        
        # Component classifier for detailed component type prediction
        self.component_classifier = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, num_classes)
        )
        
    def forward(
        self,
        images: List[torch.Tensor],
        targets: Optional[List[Dict[str, torch.Tensor]]] = None
    ) -> Dict[str, torch.Tensor]:
        """
        Forward pass for component detection
        
        Args:
            images: List of images
            targets: Optional list of targets for training
            
        Returns:
            Dict containing detections and component classifications
        """
        if self.training and targets is None:
            raise ValueError("In training mode, targets should be passed")
            
        original_image_sizes = []
        for img in images:
            val = img.shape[-2:]
            assert len(val) == 2
            original_image_sizes.append((val[0], val[1]))
            
        # Get model predictions
        detections = self.model(images, targets)
        
        if self.training:
            return detections
            
        # Post-process detections
        results = []
        for detection in detections:
            boxes = detection['boxes']
            scores = detection['scores']
            labels = detection['labels']
            masks = detection['masks']
            
            # Get ROI features for component classification
            roi_features = self.model.roi_heads.box_roi_pool(
                self.model.backbone(images)[0],
                boxes,
                original_image_sizes
            )
            
            # Classify components
            component_scores = self.component_classifier(roi_features.mean(dim=[2, 3]))
            component_types = torch.argmax(component_scores, dim=1)
            
            results.append({
                'boxes': boxes,
                'scores': scores,
                'labels': labels,
                'masks': masks,
                'component_types': component_types,
                'component_scores': component_scores
            })
            
        return results
    
    def predict_components(
        self,
        image: torch.Tensor,
        confidence_threshold: float = 0.7
    ) -> List[Dict[str, torch.Tensor]]:
        """
        Predict UI components in an image
        
        Args:
            image: Input image tensor
            confidence_threshold: Minimum confidence score for detections
            
        Returns:
            List of detected components with their properties
        """
        self.eval()
        with torch.no_grad():
            predictions = self(image)
            
        filtered_predictions = []
        for pred in predictions:
            # Filter by confidence
            mask = pred['scores'] > confidence_threshold
            
            filtered_pred = {
                'boxes': pred['boxes'][mask],
                'scores': pred['scores'][mask],
                'labels': pred['labels'][mask],
                'masks': pred['masks'][mask],
                'component_types': pred['component_types'][mask],
                'component_scores': pred['component_scores'][mask]
            }
            
            filtered_predictions.append(filtered_pred)
            
        return filtered_predictions

class ComponentHierarchyAnalyzer:
    """Analyzes spatial relationships between detected components"""
    
    @staticmethod
    def compute_iou(box1: torch.Tensor, box2: torch.Tensor) -> float:
        """Compute IoU between two bounding boxes"""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        
        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        
        return intersection / (area1 + area2 - intersection)
    
    @staticmethod
    def build_hierarchy(
        components: Dict[str, torch.Tensor]
    ) -> Dict[int, List[int]]:
        """Build component hierarchy based on spatial relationships"""
        boxes = components['boxes']
        hierarchy = {}
        
        for i in range(len(boxes)):
            parent_idx = None
            max_area = 0
            
            for j in range(len(boxes)):
                if i != j:
                    iou = ComponentHierarchyAnalyzer.compute_iou(boxes[i], boxes[j])
                    area = (boxes[j][2] - boxes[j][0]) * (boxes[j][3] - boxes[j][1])
                    
                    # Check if component i is contained within component j
                    if (iou > 0.8 and area > max_area and
                        boxes[j][0] <= boxes[i][0] and
                        boxes[j][1] <= boxes[i][1] and
                        boxes[j][2] >= boxes[i][2] and
                        boxes[j][3] >= boxes[i][3]):
                        parent_idx = j
                        max_area = area
            
            if parent_idx is not None:
                if parent_idx not in hierarchy:
                    hierarchy[parent_idx] = []
                hierarchy[parent_idx].append(i)
                
        return hierarchy

class StyleTransferModule(nn.Module):
    """Module for transferring styles between components"""
    
    def __init__(self, feature_dim: int = 256):
        super().__init__()
        
        # Style encoder
        self.style_encoder = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(128, feature_dim, kernel_size=3, padding=1),
            nn.ReLU()
        )
        
        # Style transformer
        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(
                d_model=feature_dim,
                nhead=8,
                dim_feedforward=1024
            ),
            num_layers=3
        )
        
        # Style decoder
        self.style_decoder = nn.Sequential(
            nn.ConvTranspose2d(feature_dim, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(128, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(64, 3, kernel_size=3, padding=1),
            nn.Tanh()
        )
        
    def forward(
        self,
        content_image: torch.Tensor,
        style_image: torch.Tensor
    ) -> torch.Tensor:
        """
        Apply style transfer
        
        Args:
            content_image: Content image to style
            style_image: Image to extract style from
            
        Returns:
            Styled content image
        """
        # Extract features
        content_features = self.style_encoder(content_image)
        style_features = self.style_encoder(style_image)
        
        # Reshape for transformer
        b, c, h, w = content_features.shape
        content_seq = content_features.view(b, c, -1).permute(2, 0, 1)
        style_seq = style_features.view(b, c, -1).permute(2, 0, 1)
        
        # Apply transformer
        transformed_features = self.transformer(
            torch.cat([content_seq, style_seq], dim=0)
        )[:h*w]  # Take only content sequence
        
        # Reshape back
        transformed_features = transformed_features.permute(1, 2, 0).view(b, c, h, w)
        
        # Decode
        styled_image = self.style_decoder(transformed_features)
        
        return styled_image
