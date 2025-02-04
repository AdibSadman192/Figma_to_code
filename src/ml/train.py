import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from model import DesignToCode
import json
import os
from PIL import Image
import torchvision.transforms as transforms
from typing import List, Dict, Any
import logging
import argparse
from tqdm import tqdm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DesignDataset(Dataset):
    def __init__(self, data_dir: str, transform=None):
        self.data_dir = data_dir
        self.transform = transform or transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        self.samples = []
        self.load_dataset()
        
    def load_dataset(self):
        """Load dataset from the data directory"""
        logger.info("Loading dataset...")
        
        for sample_dir in os.listdir(self.data_dir):
            sample_path = os.path.join(self.data_dir, sample_dir)
            if os.path.isdir(sample_path):
                try:
                    # Load image
                    image_path = os.path.join(sample_path, 'design.png')
                    
                    # Load HTML
                    with open(os.path.join(sample_path, 'index.html'), 'r') as f:
                        html = f.read()
                        
                    # Load CSS
                    with open(os.path.join(sample_path, 'styles.css'), 'r') as f:
                        css = f.read()
                        
                    self.samples.append({
                        'image_path': image_path,
                        'html': html,
                        'css': css
                    })
                except Exception as e:
                    logger.warning(f"Error loading sample {sample_dir}: {e}")
                    
        logger.info(f"Loaded {len(self.samples)} samples")
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        sample = self.samples[idx]
        
        # Load and transform image
        image = Image.open(sample['image_path']).convert('RGB')
        if self.transform:
            image = self.transform(image)
            
        return {
            'image': image,
            'html': sample['html'],
            'css': sample['css']
        }

def train_model(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    num_epochs: int,
    device: torch.device,
    save_dir: str
):
    """Train the model"""
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    best_val_loss = float('inf')
    
    for epoch in range(num_epochs):
        logger.info(f"Epoch {epoch+1}/{num_epochs}")
        
        # Training phase
        model.train()
        train_loss = 0.0
        train_batches = tqdm(train_loader, desc="Training")
        
        for batch in train_batches:
            images = batch['image'].to(device)
            html_tokens = batch['html_tokens'].to(device)
            css_tokens = batch['css_tokens'].to(device)
            
            optimizer.zero_grad()
            
            outputs = model(images, html_tokens, css_tokens)
            
            # Calculate loss
            html_loss = criterion(
                outputs['html_output'].view(-1, model.html_decoder.output.out_features),
                html_tokens.view(-1)
            )
            css_loss = criterion(
                outputs['css_output'].view(-1, model.css_decoder.output.out_features),
                css_tokens.view(-1)
            )
            
            loss = html_loss + css_loss
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            train_batches.set_postfix({'loss': loss.item()})
            
        avg_train_loss = train_loss / len(train_loader)
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        
        with torch.no_grad():
            for batch in tqdm(val_loader, desc="Validation"):
                images = batch['image'].to(device)
                html_tokens = batch['html_tokens'].to(device)
                css_tokens = batch['css_tokens'].to(device)
                
                outputs = model(images, html_tokens, css_tokens)
                
                html_loss = criterion(
                    outputs['html_output'].view(-1, model.html_decoder.output.out_features),
                    html_tokens.view(-1)
                )
                css_loss = criterion(
                    outputs['css_output'].view(-1, model.css_decoder.output.out_features),
                    css_tokens.view(-1)
                )
                
                val_loss += (html_loss + css_loss).item()
                
        avg_val_loss = val_loss / len(val_loader)
        
        logger.info(f"Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}")
        
        # Save best model
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), os.path.join(save_dir, 'best_model.pth'))
            logger.info("Saved best model")

def main():
    parser = argparse.ArgumentParser(description='Train Design to Code model')
    parser.add_argument('--data-dir', type=str, required=True, help='Path to dataset directory')
    parser.add_argument('--save-dir', type=str, default='checkpoints', help='Directory to save model checkpoints')
    parser.add_argument('--epochs', type=int, default=100, help='Number of epochs to train')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    args = parser.parse_args()
    
    # Create save directory if it doesn't exist
    os.makedirs(args.save_dir, exist_ok=True)
    
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {device}")
    
    # Create dataset and dataloaders
    dataset = DesignDataset(args.data_dir)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size)
    
    # Initialize model
    model = DesignToCode(
        html_vocab_size=1000,  # Update with actual vocabulary sizes
        css_vocab_size=1000
    ).to(device)
    
    # Train model
    train_model(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        num_epochs=args.epochs,
        device=device,
        save_dir=args.save_dir
    )

if __name__ == '__main__':
    main()
