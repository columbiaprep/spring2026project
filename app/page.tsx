import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect immediately to the 3D map page
  redirect('/grant-test')
}
