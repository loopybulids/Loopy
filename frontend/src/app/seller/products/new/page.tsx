import { redirect } from 'next/navigation';

export default function NewProductRedirect() {
  redirect('/seller/list');
}
