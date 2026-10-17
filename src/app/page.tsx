import { redirect } from 'next/navigation';
import { DEFAULT_CAMPUS_SLUG } from '@/config/campuses';

export default function RootPage() {
  redirect(`/${DEFAULT_CAMPUS_SLUG}`);
}
