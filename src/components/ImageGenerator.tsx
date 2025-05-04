import React, { useState } from 'react';
import { Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Box, CircularProgress, Paper } from '@mui/material';
import { assistantConversationService } from '../services/assistantConversationService';

const imageStyles = [
  { name: 'Photorealistic', value: 'photorealistic' },
  { name: 'Digital Art', value: 'digital art' },
  { name: 'Watercolor', value: 'watercolor painting style' },
  { name: 'Oil Painting', value: 'oil painting style' },
  { name: 'Pencil Sketch', value: 'pencil sketch' },
  { name: '3D Render', value: '3d render style' },
  { name: 'Fantasy', value: 'fantasy style art' },
  { name: 'Anime', value: 'anime style' }
];

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter an image description');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setGeneratedImage(null);

      const imageUrl = await assistantConversationService.generateImage({
        prompt,
        style,
        negativePrompt: negativePrompt || undefined
      });

      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h5" gutterBottom>Image Generator</Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Image Description"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate"
            multiline
            rows={3}
            margin="normal"
          />
        </Box>
        
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Art Style</InputLabel>
            <Select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              label="Art Style"
            >
              <MenuItem value="">No specific style</MenuItem>
              {imageStyles.map((style) => (
                <MenuItem key={style.value} value={style.value}>
                  {style.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Negative Prompt (elements to avoid)"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="Elements you don't want in the image"
            margin="normal"
          />
        </Box>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleGenerateImage}
          disabled={isLoading || !prompt.trim()}
          fullWidth
          sx={{ mb: 2 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Generate Image'}
        </Button>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {generatedImage && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Paper elevation={2} sx={{ p: 1, mb: 2 }}>
              <img 
                src={generatedImage} 
                alt="Generated" 
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
              />
            </Paper>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={handleDownloadImage}
            >
              Download Image
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};