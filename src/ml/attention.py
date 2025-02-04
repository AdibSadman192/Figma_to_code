import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % num_heads == 0, "d_model must be divisible by num_heads"
        
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        
        self.dropout = nn.Dropout(dropout)
        
    def forward(
        self,
        query: torch.Tensor,
        key: torch.Tensor,
        value: torch.Tensor,
        mask: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        batch_size = query.size(0)
        
        # Linear transformations
        Q = self.W_q(query)
        K = self.W_k(key)
        V = self.W_v(value)
        
        # Split into heads
        Q = Q.view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        
        # Scaled dot-product attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / torch.sqrt(
            torch.tensor(self.d_k, dtype=torch.float32)
        )
        
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))
        
        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)
        
        # Apply attention to values
        context = torch.matmul(attention_weights, V)
        
        # Concatenate heads and apply final linear transformation
        context = context.transpose(1, 2).contiguous().view(
            batch_size, -1, self.d_model
        )
        output = self.W_o(context)
        
        return output, attention_weights

class StyleAttention(nn.Module):
    def __init__(self, d_model: int, num_heads: int = 8):
        super().__init__()
        self.attention = MultiHeadAttention(d_model, num_heads)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, d_model * 4),
            nn.ReLU(),
            nn.Linear(d_model * 4, d_model)
        )
        
    def forward(
        self,
        design_features: torch.Tensor,
        style_features: torch.Tensor
    ) -> torch.Tensor:
        # Self attention on design features
        attended_design, _ = self.attention(
            design_features,
            design_features,
            design_features
        )
        design_features = self.norm1(design_features + attended_design)
        
        # Cross attention with style features
        style_context, _ = self.attention(
            design_features,
            style_features,
            style_features
        )
        combined = self.norm2(design_features + style_context)
        
        # Feed forward
        output = self.feed_forward(combined)
        return output

class DesignStyleExtractor(nn.Module):
    def __init__(self, d_model: int = 512):
        super().__init__()
        self.color_encoder = nn.Sequential(
            nn.Linear(3, 64),
            nn.ReLU(),
            nn.Linear(64, d_model)
        )
        
        self.typography_encoder = nn.Sequential(
            nn.Linear(10, 64),  # font-size, weight, family, etc.
            nn.ReLU(),
            nn.Linear(64, d_model)
        )
        
        self.layout_encoder = nn.Sequential(
            nn.Linear(6, 64),  # x, y, width, height, padding, margin
            nn.ReLU(),
            nn.Linear(64, d_model)
        )
        
        self.style_attention = StyleAttention(d_model)
        
    def extract_color_features(self, colors: torch.Tensor) -> torch.Tensor:
        """Extract features from color information"""
        return self.color_encoder(colors)
    
    def extract_typography_features(
        self,
        typography: torch.Tensor
    ) -> torch.Tensor:
        """Extract features from typography information"""
        return self.typography_encoder(typography)
    
    def extract_layout_features(self, layout: torch.Tensor) -> torch.Tensor:
        """Extract features from layout information"""
        return self.layout_encoder(layout)
    
    def forward(
        self,
        colors: torch.Tensor,
        typography: torch.Tensor,
        layout: torch.Tensor
    ) -> torch.Tensor:
        # Extract features from different style aspects
        color_features = self.extract_color_features(colors)
        typography_features = self.extract_typography_features(typography)
        layout_features = self.extract_layout_features(layout)
        
        # Combine all features
        style_features = torch.stack(
            [color_features, typography_features, layout_features],
            dim=1
        )
        
        # Apply style attention
        design_features = self.style_attention(
            style_features,
            style_features
        )
        
        return design_features.mean(dim=1)  # Average across style aspects
