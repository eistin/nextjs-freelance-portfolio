"use server";

import { Resend } from "resend";
import { z } from "zod";
import { getTranslations } from "next-intl/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// Create validation schema with translations
const createContactSchema = async (locale: string) => {
  const t = await getTranslations({ locale, namespace: 'errors' });
  
  return z.object({
    fullName: z.string().min(1, t('fullNameRequired')),
    email: z.string().email(t('invalidEmail')),
    subject: z.string().min(1, t('subjectRequired')),
    message: z.string().min(1, t('messageRequired')),
  });
};

// Base type for form data
export type ContactFormData = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

export interface ActionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export async function submitContactForm(
  formData: FormData,
  locale: string = 'en'
): Promise<ActionResult> {
  // Get translations for error messages (moved outside try-catch for scope)
  const t = await getTranslations({ locale, namespace: 'contact.form' });
  const tErrors = await getTranslations({ locale, namespace: 'errors' });
  
  try {
    console.log("🚀 Contact form submission started");
    
    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is missing");
      return {
        success: false,
        message: t('serviceNotConfigured'),
      };
    }

    // Extract form data
    const data = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    console.log("📝 Form data extracted:", {
      fullName: data.fullName,
      email: data.email,
      subject: data.subject,
      messageLength: data.message?.length,
    });

    // Validate data using localized schema
    const contactSchema = await createContactSchema(locale);
    const validationResult = contactSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        message: tErrors('validationFailed'),
        errors: Object.fromEntries(
          Object.entries(errors).map(([key, value]) => [key, value?.[0] || ""])
        ),
      };
    }

    const { fullName, email, subject, message } = validationResult.data;

    console.log("✅ Form validation passed");

    // Prepare email configuration with marketing copy
    const fromEmail = process.env.FROM_EMAIL_DOMAIN 
      ? `Edwin Istin <noreply@${process.env.FROM_EMAIL_DOMAIN}>`
      : "onboarding@resend.dev";
    
    // Better marketing subject based on locale
    const marketingSubject = locale === 'fr' 
      ? `🚀 Nouvelle opportunité: ${fullName} souhaite collaborer avec vous`
      : `🚀 New opportunity: ${fullName} wants to work with you`;
      
    const emailConfig = {
      from: fromEmail,
      to: [process.env.CONTACT_EMAIL || "your-email@example.com"],
      subject: marketingSubject,
    };

    console.log("📧 Email config:", {
      from: emailConfig.from,
      to: emailConfig.to,
      subject: emailConfig.subject,
    });

    // Create marketing-focused email content
    const emailContent = locale === 'fr' ? {
      title: `🎯 Nouvelle opportunité client`,
      clientLabel: 'Client potentiel',
      emailLabel: 'Email',
      subjectLabel: 'Sujet',
      messageLabel: 'Message',
      cta: `💼 ${fullName} semble intéressé(e) par vos services DevOps/SRE !`,
      footer: 'Envoyé depuis votre portfolio professionnel'
    } : {
      title: `🎯 New client opportunity`,
      clientLabel: 'Potential client',
      emailLabel: 'Email',
      subjectLabel: 'Subject', 
      messageLabel: 'Message',
      cta: `💼 ${fullName} looks interested in your DevOps/SRE services!`,
      footer: 'Sent from your professional portfolio'
    };

    // Send email using Resend
    const emailResult = await resend.emails.send({
      ...emailConfig,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${emailContent.title}</h1>
          </div>
          
          <div style="padding: 30px; background: white;">
            <div style="background: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">${emailContent.cta}</h2>
            </div>
            
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 20px 0;">
              <h3 style="color: #334155; margin: 0 0 20px 0; font-size: 16px; font-weight: 600;">Contact Details:</h3>
              <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
                <tr>
                  <td style="font-weight: 600; color: #475569; padding: 8px 12px; background: #f1f5f9; border-radius: 4px; width: 120px;">${emailContent.clientLabel}:</td>
                  <td style="color: #1e293b; padding: 8px 12px;">${fullName}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #475569; padding: 8px 12px; background: #f1f5f9; border-radius: 4px;">${emailContent.emailLabel}:</td>
                  <td style="color: #1e293b; padding: 8px 12px;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #475569; padding: 8px 12px; background: #f1f5f9; border-radius: 4px;">${emailContent.subjectLabel}:</td>
                  <td style="color: #1e293b; padding: 8px 12px;">${subject}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 20px 0;">
              <h3 style="color: #334155; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">${emailContent.messageLabel}:</h3>
              <div style="color: #475569; line-height: 1.7; background: #f8fafc; padding: 20px; border-radius: 6px; border-left: 3px solid #667eea;">
                ${message.replace(/\n/g, "<br>")}
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${email}?subject=Re: ${subject}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                💬 ${locale === 'fr' ? 'Répondre maintenant' : 'Reply Now'}
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">${emailContent.footer}</p>
          </div>
        </div>
      `,
      replyTo: email,
    });

    console.log("📬 Email sent successfully:", emailResult);

    return {
      success: true,
      message: t('success'),
    };
  } catch (error) {
    console.error("❌ Contact form error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: t('error'),
    };
  }
}