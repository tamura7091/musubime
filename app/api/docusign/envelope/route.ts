import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

// Lazy import to avoid SSR issues if module is missing in some environments
async function getDocusign() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const docusign = require('docusign-esign');
  return docusign;
}

export async function POST(req: NextRequest) {
  try {
    const { signerEmail, signerName, returnUrl, templateId } = await req.json();

    if (!process.env.DOCUSIGN_API_ACCOUNT_ID || !process.env.DOCUSIGN_INTEGRATION_KEY || !process.env.DOCUSIGN_PRIVATE_KEY || !process.env.DOCUSIGN_IMPERSONATED_USER_ID) {
      return NextResponse.json({ error: 'DocuSign env vars missing' }, { status: 500 });
    }

    const docusign = await getDocusign();

    const dsApiClient = new docusign.ApiClient();
    dsApiClient.setOAuthBasePath('account-d.docusign.com');

    const rsaKey = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    const jwtResponse = await dsApiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY,
      process.env.DOCUSIGN_IMPERSONATED_USER_ID,
      ['signature', 'impersonation'],
      rsaKey,
      3600
    );

    const accessToken = jwtResponse.body.access_token;
    const accountId = process.env.DOCUSIGN_API_ACCOUNT_ID;

    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
    dsApiClient.setBasePath('https://demo.docusign.net/restapi');

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);

    // Create envelope from template (preferred) or ad-hoc document omitted for brevity
    const envelopeDefinition: any = templateId
      ? {
          templateId,
          templateRoles: [
            {
              email: signerEmail,
              name: signerName,
              roleName: 'signer',
            },
          ],
          status: 'sent',
        }
      : {
          emailSubject: 'Speak PR 契約書',
          status: 'created',
        };

    const envelopeSummary = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });

    const recipientViewRequest = new docusign.RecipientViewRequest();
    recipientViewRequest.returnUrl = returnUrl || 'https://musubime.app/dashboard';
    recipientViewRequest.authenticationMethod = 'none';
    recipientViewRequest.email = signerEmail;
    recipientViewRequest.userName = signerName;
    recipientViewRequest.clientUserId = '1';

    const viewUrl = await envelopesApi.createRecipientView(accountId, envelopeSummary.envelopeId, { recipientViewRequest });

    return NextResponse.json({ url: viewUrl.url, envelopeId: envelopeSummary.envelopeId });
  } catch (error: any) {
    console.error('DocuSign error', error?.response?.body || error);
    return NextResponse.json({ error: 'DocuSign integration failed', detail: error?.response?.body || String(error) }, { status: 500 });
  }
}





