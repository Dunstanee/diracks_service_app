# Environment Setup Guide

## API Configuration

This app requires an API domain to be configured. Follow these steps:

### 1. Create a `.env` file

Create a `.env` file in the root directory of the project with the following content:

```
EXPO_PUBLIC_API_DOMAIN=https://your-api-domain.com
```

### 2. Set your API domain

Replace `https://your-api-domain.com` with your actual API domain. Examples:

- **Production:** `EXPO_PUBLIC_API_DOMAIN=https://api.example.com`
- **Local development:** `EXPO_PUBLIC_API_DOMAIN=http://localhost:3000`
- **Staging:** `EXPO_PUBLIC_API_DOMAIN=https://staging-api.example.com`

### 3. Important Notes

- **Expo requires the `EXPO_PUBLIC_` prefix** for environment variables to be accessible in client-side code
- After creating or modifying the `.env` file, you may need to restart your Expo development server
- The `.env` file should be added to `.gitignore` to keep your API configuration private

### 4. Troubleshooting

If you see "Network request failed" errors:

1. Verify your `.env` file exists in the root directory
2. Check that `EXPO_PUBLIC_API_DOMAIN` is set correctly
3. Ensure the API domain includes the protocol (`http://` or `https://`)
4. Restart your Expo development server after changing environment variables
5. Check that your API server is running and accessible

### 5. Example `.env` file

```env
# API Configuration
EXPO_PUBLIC_API_DOMAIN=https://api.example.com
```

