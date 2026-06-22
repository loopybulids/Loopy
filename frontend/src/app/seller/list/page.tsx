import { redirect } from 'next/navigation';

// Legacy dark "List an Item" page replaced by the light console page.
export default function ListRedirect() {
  redirect('/seller/products/new');
}
