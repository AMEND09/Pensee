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

  if (title.length < 3) {
    throw new Error('Please add a short title (at least 3 characters).');
  }
  if (details.length < 10) {
    throw new Error('Please add more detail (at least 10 characters).');
  }

  const authRecord = pb.authStore.record as Record<string, any> | null;
  const email = input.email?.trim() || (authRecord?.['email'] as string | undefined) || null;

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
}
