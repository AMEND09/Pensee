import { Platform } from 'react-native';
import pb from './pocketbase';

export type FeedbackKind = 'bug' | 'feature';

export type SubmitFeedbackInput = {
  kind: FeedbackKind;
  title: string;
  details: string;
  source: string;
  email?: string;
};

export async function submitFeedbackRequest(input: SubmitFeedbackInput): Promise<void> {
  const title = input.title.trim();
  const details = input.details.trim();

  console.log('[feedback] submitFeedbackRequest called', {
    kind: input.kind,
    source: input.source,
    titleLength: title.length,
    detailsLength: details.length,
  });

  if (title.length < 3) {
    console.warn('[feedback] validation failed: title too short');
    throw new Error('Please add a short title (at least 3 characters).');
  }
  if (details.length < 10) {
    console.warn('[feedback] validation failed: details too short');
    throw new Error('Please add more detail (at least 10 characters).');
  }

  const authRecord = pb.authStore.record as Record<string, any> | null;
  const email = input.email?.trim() || (authRecord?.['email'] as string | undefined) || null;

  console.log('[feedback] creating PocketBase record', {
    collection: 'feedback_requests',
    baseUrl: (pb as any)?.baseUrl,
    authValid: pb.authStore.isValid,
    hasUserId: !!authRecord?.['id'],
  });

  try {
    await pb.collection('feedback_requests').create({
      kind: input.kind,
      title,
      details,
      source: input.source,
      email,
      platform: Platform.OS,
      user: authRecord?.['id'] ?? null,
      userName: (authRecord?.['name'] as string | undefined) ?? null,
    });
    console.log('[feedback] PocketBase create succeeded');
  } catch (err) {
    console.error('[feedback] PocketBase create failed', err);
    throw err;
  }
}
