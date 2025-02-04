import torch
import torch.nn as nn
import torchvision.models as models
from typing import Dict, List, Any

class DesignEncoder(nn.Module):
    def __init__(self, embed_dim: int = 512):
        super().__init__()
        # Use ResNet50 as the base model
        resnet = models.resnet50(pretrained=True)
        self.backbone = nn.Sequential(*list(resnet.children())[:-2])
        
        # Additional layers for design-specific features
        self.design_layers = nn.Sequential(
            nn.Conv2d(2048, 1024, kernel_size=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(1024, embed_dim)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.backbone(x)
        return self.design_layers(x)

class HTMLDecoder(nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int = 512, hidden_dim: int = 512):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=2,
            batch_first=True,
            dropout=0.1
        )
        self.output = nn.Linear(hidden_dim, vocab_size)
        
    def forward(self, x: torch.Tensor, hidden: tuple = None) -> tuple:
        x = self.embedding(x)
        output, hidden = self.lstm(x, hidden)
        output = self.output(output)
        return output, hidden

class CSSDecoder(nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int = 512, hidden_dim: int = 512):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=2,
            batch_first=True,
            dropout=0.1
        )
        self.output = nn.Linear(hidden_dim, vocab_size)
        
    def forward(self, x: torch.Tensor, hidden: tuple = None) -> tuple:
        x = self.embedding(x)
        output, hidden = self.lstm(x, hidden)
        output = self.output(output)
        return output, hidden

class DesignToCode(nn.Module):
    def __init__(
        self,
        html_vocab_size: int,
        css_vocab_size: int,
        embed_dim: int = 512,
        hidden_dim: int = 512
    ):
        super().__init__()
        self.encoder = DesignEncoder(embed_dim)
        self.html_decoder = HTMLDecoder(html_vocab_size, embed_dim, hidden_dim)
        self.css_decoder = CSSDecoder(css_vocab_size, embed_dim, hidden_dim)
        
    def forward(
        self,
        image: torch.Tensor,
        html_tokens: torch.Tensor = None,
        css_tokens: torch.Tensor = None
    ) -> Dict[str, torch.Tensor]:
        # Encode the image
        design_features = self.encoder(image)
        
        # Initialize hidden states with encoded features
        batch_size = image.size(0)
        h0 = design_features.unsqueeze(0).repeat(2, 1, 1)
        c0 = torch.zeros_like(h0)
        hidden = (h0, c0)
        
        # Generate HTML
        html_output = None
        if html_tokens is not None:
            html_output, _ = self.html_decoder(html_tokens, hidden)
            
        # Generate CSS
        css_output = None
        if css_tokens is not None:
            css_output, _ = self.css_decoder(css_tokens, hidden)
            
        return {
            'html_output': html_output,
            'css_output': css_output,
            'design_features': design_features
        }

def process_figma_node(node: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Process a Figma node and extract relevant design information."""
    processed_nodes = []
    
    def extract_styles(node: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'type': node.get('type', ''),
            'name': node.get('name', ''),
            'position': {
                'x': node.get('x', 0),
                'y': node.get('y', 0),
            },
            'size': {
                'width': node.get('width', 0),
                'height': node.get('height', 0),
            },
            'fills': node.get('fills', []),
            'strokes': node.get('strokes', []),
            'effects': node.get('effects', []),
            'layout': node.get('layout', {}),
            'constraints': node.get('constraints', {}),
        }
    
    def process_node(node: Dict[str, Any]):
        styles = extract_styles(node)
        processed_nodes.append(styles)
        
        if 'children' in node:
            for child in node['children']:
                process_node(child)
    
    process_node(node)
    return processed_nodes
