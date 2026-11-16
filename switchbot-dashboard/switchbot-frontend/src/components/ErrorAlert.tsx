export function ErrorAlert({ error }: { error?: string | null }) {
 return error ? <div role="alert" className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"><strong>Error.</strong> {error}</div> : null;
}
