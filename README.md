# Second Thought Landing Page

Landing page for Second Thought - Analytical sparring partner service by Magdalena Stodulska.

## Features

- ✅ One-time access code validation (72-hour expiry)
- ✅ Protected content after code entry
- ✅ Google Sheets integration for code management
- ✅ Netlify Functions backend
- ✅ Dark mode UI (customizable with Figma design)

## Architecture

```
Frontend:
  - index.html (Vanilla JS + CSS)
  - Welcome page with code input
  - Protected content section (unlocks after validation)

Backend:
  - Netlify Function: validate-code.js
  - Google Sheets API integration
  - JWT token generation

Database:
  - Google Sheets (SecondThought_AccessCodes)
  - 50 one-time access codes
  - 72-hour expiry from first use
```

## Deployment

Hosted on Netlify with custom domain: secondthought.guru

### Environment Variables (set in Netlify):
- `GOOGLE_SERVICE_ACCOUNT_KEY` - JSON credentials from Google Cloud
- `SPREADSHEET_ID` - Google Sheets ID for access codes

### Setup Instructions

See `DEPLOYMENT_GUIDE.md` for step-by-step instructions.

## File Structure

```
secondthought-landing/
├── index.html                    # Main landing page
├── package.json                  # Dependencies
├── netlify.toml                  # Netlify configuration
├── .gitignore                    # Git ignore
├── netlify/
│   └── functions/
│       └── validate-code.js      # Code validation function
└── DEPLOYMENT_GUIDE.md           # Deployment instructions
```

## Testing

1. Deploy to Netlify
2. Visit https://secondthought.guru (or Netlify preview URL)
3. Enter access code (e.g., `FB40F543`)
4. Verify protected content loads
5. Check Google Sheets - code should be marked as `used=YES`

## Design

CSS is currently placeholder. Will be replaced with Figma design.

### Style Variables (in index.html):
- Primary background: `#0a0e27` (dark navy)
- Secondary background: `#141829`
- Text primary: `#ffffff`
- Text secondary: `#b0b5c1`
- Accent: `#6366f1` (indigo)
- Border: `#2d3142`

## Support

For issues or questions, contact: secondthought.msa@gmail.com
