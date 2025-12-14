# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/665c2a8c-0c43-4fc5-b4ce-2e6167870d78

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/665c2a8c-0c43-4fc5-b4ce-2e6167870d78) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## SMS Invite (Server-side)

Enable direct SMS sending (without opening the messaging app) using a Supabase Edge Function.

### Provider Options

You can use either Textlocal or MSG91. Set one provider via secrets.

### Quick Setup

1. **Install Supabase CLI** (if not already installed):

```bash
brew install supabase/tap/supabase
supabase login
```

2. **Link your project** and **deploy the function**:

```bash
supabase link --project-ref ssaogbrpjvxvlxtdivah
supabase functions deploy send-sms
```

3. **Set provider secrets**:

Textlocal (simple onboarding):

```bash
supabase secrets set \
	SMS_PROVIDER=TEXTLOCAL \
	TEXTLOCAL_API_KEY=tl_xxxxxxxxxxxxxxxxxxxxxxxxx \
	TEXTLOCAL_SENDER=DDLGRS \
	SMS_BEARER_TOKEN=any_random_secure_token_you_create
```

MSG91 (DLT-compliant in India):

```bash
supabase secrets set \
	SMS_PROVIDER=MSG91 \
	MSG91_AUTH_KEY=xxxxxxxxxxxxxxxx \
	MSG91_SENDER_ID=DDLGRS \
	MSG91_TEMPLATE_ID=120716xxxxx \
	SMS_BEARER_TOKEN=any_random_secure_token_you_create
```

4. **Frontend env**: update `.env.local` with the same bearer token:

```env
VITE_SMS_API_URL=https://ssaogbrpjvxvlxtdivah.supabase.co/functions/v1/send-sms
VITE_SMS_API_TOKEN=any_random_secure_token_you_create
```

5. **Restart your dev server**:

```bash
npm run dev
```

### Test the function

```bash
curl -i \
	-H "Authorization: Bearer any_random_secure_token_you_create" \
	-H "Content-Type: application/json" \
	-d '{"to":"+919876543210","body":"https://your-app/invite?code=XYZ"}' \
	https://ssaogbrpjvxvlxtdivah.supabase.co/functions/v1/send-sms
```

### Alternative: Deploy via Supabase Dashboard

If you prefer not to use CLI:

1. Go to https://supabase.com/dashboard/project/ssaogbrpjvxvlxtdivah/functions
2. Click "Deploy new function"
3. Upload the code from `supabase/functions/send-sms/index.ts`
4. Set the secrets in Settings > Edge Functions > Secrets
5. Update `.env.local` with the bearer token

The app will now send SMS directly via the API with success toast notifications!

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/665c2a8c-0c43-4fc5-b4ce-2e6167870d78) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
