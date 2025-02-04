# Project Setup and Deployment Guide

This document outlines everything you need to set up, run, and deploy the Figma to Code Converter project.

## Prerequisites

### Required Software
- Node.js (v18.0.0 or higher)
- Python (v3.8 or higher)
- Git

### Required Accounts
1. **Figma Account**
   - Create a Figma account
   - Set up a Figma developer account
   - Create a new Figma app to get API credentials

2. **Supabase Account**
   - Create a new project
   - Get the project URL and anon key
   - Set up authentication providers

3. **Vercel Account** (for deployment)
   - Connect with your GitHub repository

## Local Development Setup

### 1. Prerequisites
- Node.js 18.x or later
- npm 9.x or later
- Git
- A code editor (VS Code recommended)
- A Supabase account
- A Figma account with access token

### 2. Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/figma-to-code.git
cd figma-to-code
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure Supabase:
   - Create a new project at [Supabase](https://supabase.com)
   - Enable Email authentication
   - Get your project URL and anon key
   - Add them to `.env.local`

5. Set up the database:
   - Go to your Supabase project's SQL editor
   - Run the SQL scripts from the `/supabase` directory in order:
     1. `schema.sql`
     2. `add_full_name.sql`

6. Start the development server:
```bash
npm run dev
```

### 3. Development Workflow

1. **Code Organization**
   - `/src/app`: Next.js pages and routes
   - `/src/components`: Reusable React components
   - `/src/lib`: Utility functions and services
   - `/src/styles`: Global styles and Tailwind configuration

2. **Working with Supabase**
   - Access Supabase client through the `useSupabase()` hook
   - Use `supabase.auth` for authentication
   - Use `supabase.from()` for database operations

3. **Figma Integration**
   - Get your Figma access token from Figma settings
   - Add it to your user settings in the app
   - Use the dashboard to import Figma designs

4. **Styling**
   - Use Tailwind CSS for styling
   - Dark/light theme support via `next-themes`
   - Custom components in `/src/components/ui`

### 4. Testing

1. Run tests:
```bash
npm test
```

2. Run linting:
```bash
npm run lint
```

### 5. Building for Production

1. Create a production build:
```bash
npm run build
```

2. Test the production build locally:
```bash
npm start
```

### 6. Deployment

1. **Vercel Deployment**:
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically with git push

2. **Manual Deployment**:
   - Build the project: `npm run build`
   - Start the server: `npm start`
   - Use a process manager like PM2 (optional):
     ```bash
     npm install -g pm2
     pm2 start npm --name "figma-to-code" -- start
     ```

### 7. Maintenance

1. **Updates**:
   - Keep dependencies updated: `npm update`
   - Check for security vulnerabilities: `npm audit`

2. **Monitoring**:
   - Use Vercel Analytics (if deployed on Vercel)
   - Monitor Supabase usage in dashboard

3. **Backups**:
   - Enable automatic backups in Supabase
   - Regularly export important data

### 8. Troubleshooting

1. **Common Issues**:
   - Clear `.next` cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check Supabase connection: Test auth and database queries
   - Verify environment variables are set correctly

2. **Debug Mode**:
   ```bash
   NODE_ENV=development DEBUG=* npm run dev
   ```

### 9. Performance Optimization

1. **Code Optimization**:
   - Use React.memo() for expensive components
   - Implement proper data fetching strategies
   - Optimize images and assets

2. **Build Optimization**:
   - Enable compression
   - Implement caching strategies
   - Use CDN for static assets

### 10. Security Best Practices

1. **Environment Variables**:
   - Never commit `.env.local`
   - Use `.env.example` for documentation
   - Regularly rotate API keys

2. **Authentication**:
   - Implement proper session handling
   - Use secure password policies
   - Enable email verification

3. **Data Protection**:
   - Validate all user inputs
   - Implement proper CORS policies
   - Regular security audits

### 11. Scaling

1. **Database**:
   - Use connection pooling
   - Implement proper indexing
   - Regular database maintenance

2. **Application**:
   - Implement caching where appropriate
   - Use CDN for static assets
   - Optimize API calls

## ML Model Setup

1. **Model Training** (if needed)
   ```bash
   cd ml
   python train.py --data-path ./data --epochs 100
   ```

2. **Model Deployment**
   - The model will be automatically packaged in a Docker container
   - For local testing, use `docker-compose up`
   - For production, deploy to a cloud provider with GPU support

## Deployment Process

### 1. Frontend Deployment (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy using Vercel's automatic deployment

### 2. ML Service Deployment
1. Build the Docker image:
   ```bash
   docker build -t figma-to-code-ml ./ml
   ```
2. Deploy to your chosen cloud provider (AWS, GCP, or Azure)
3. Update the ML_SERVICE_URL in your environment variables

### 3. Database Deployment
- Supabase handles database hosting automatically
- Run migrations on the production database
- Set up backup procedures

## Monitoring and Maintenance

### Logging
- Frontend logs available in Vercel dashboard
- ML service logs through your cloud provider
- Database logs in Supabase dashboard

### Performance Monitoring
- Set up Sentry for error tracking
- Monitor ML model performance
- Track API response times

### Regular Maintenance
- Update dependencies monthly
- Monitor security advisories
- Backup database regularly
- Update ML model with new training data

## Troubleshooting

### Common Issues
1. **Figma API Connection Issues**
   - Check API token validity
   - Verify rate limits
   - Check network connectivity

2. **ML Service Issues**
   - Verify Docker container status
   - Check GPU availability
   - Monitor memory usage

3. **Database Issues**
   - Check Supabase status
   - Verify connection strings
   - Monitor database performance

## Security Considerations

1. **API Security**
   - Keep API keys secure
   - Implement rate limiting
   - Use HTTPS everywhere

2. **Data Privacy**
   - Implement data encryption
   - Regular security audits
   - GDPR compliance measures

3. **Authentication**
   - Secure user sessions
   - Implement 2FA
   - Regular security updates
