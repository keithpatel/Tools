import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-heading font-bold mb-4">404</h1>
      <p className="text-text-secondary mb-6">Page not found</p>
      <Link href="/" className="text-accent hover:underline text-sm">Back to homepage</Link>
    </div>
  );
}
