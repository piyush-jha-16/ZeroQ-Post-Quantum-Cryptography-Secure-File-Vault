import VaultLayout from '../components/VaultLayout'
import encryptionFlow from '../assets/docs/encryption-flow.svg'
import threatModel from '../assets/docs/threat-model.svg'
import platformComparison from '../assets/docs/platform-comparison.svg'

const processSteps = [
  {
    title: 'Key Generation In Browser',
    detail:
      'When a user registers, ML-KEM and ML-DSA key pairs are generated locally. Private keys do not need to travel to backend services in plaintext.',
  },
  {
    title: 'Recipient Key Fetch + Encapsulation',
    detail:
      'The sender fetches recipient public keys only. A shared secret is encapsulated with recipient ML-KEM public key for each file transfer.',
  },
  {
    title: 'Client-Side Encryption + Signature',
    detail:
      'File bytes are encrypted in-browser with AES-256-GCM and signed by sender ML-DSA private key. The server receives ciphertext and metadata only.',
  },
  {
    title: 'Verification Before Decryption',
    detail:
      'Recipient first verifies ML-DSA signature, then decapsulates ML-KEM secret and decrypts locally. This blocks tampered payloads from being opened.',
  },
]

const comparisonRows = [
  {
    factor: 'Plaintext exposure to platform backend',
    traditional: 'Common (provider-managed keys or decryptable processing)',
    email: 'Common (message content often server-accessible)',
    zeroq: 'Low by design (ciphertext-only storage)',
  },
  {
    factor: 'Tamper detection before opening file',
    traditional: 'Limited and vendor-specific',
    email: 'Typically absent for attachments',
    zeroq: 'Built-in via ML-DSA signature verification',
  },
  {
    factor: 'Post-quantum cryptography readiness',
    traditional: 'Generally not default',
    email: 'Generally not default',
    zeroq: 'Core architecture includes ML-KEM and ML-DSA',
  },
  {
    factor: 'Security model transparency',
    traditional: 'Depends on provider documentation',
    email: 'Low user visibility',
    zeroq: 'Explicit client-side workflow and trust boundaries',
  },
]

const threatBullets = [
  'Network interception sees encrypted payload, not plaintext file contents.',
  'Payload tampering is detected by signature verification before decryption.',
  'Backend database leak should expose ciphertext, nonces, and metadata instead of clear files.',
  'Recipient private keys are required for successful decapsulation and final decryption.',
]

const limitsBullets = [
  'If attacker controls endpoint device, local keys and session can be stolen.',
  'Weak credentials still allow account takeover risk.',
  'Metadata (sender, receiver, timestamps, filename) remains operationally visible.',
  'Recovery secret must be strong and stored safely by users.',
]

export default function Documentation() {
  return (
    <VaultLayout
      activeNav="documentation"
      title="Documentation"
      subtitle="Architecture, security model, and why ZeroQ is safer than traditional file sharing workflows."
    >
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="card-panel overflow-hidden p-0">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="p-8 lg:col-span-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Security Whitepaper Summary</p>
              <h3 className="text-main text-2xl font-extrabold tracking-tight">Why ZeroQ Is Safer For Sensitive File Transfer</h3>
              <p className="mt-4 text-sm text-muted leading-7">
                ZeroQ is built so file plaintext is encrypted before upload and decrypted only by the recipient browser. Even if transport is intercepted
                or backend storage is leaked, attackers should not be able to read the file without endpoint compromise and private key access.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">Cryptography Stack</p>
                  <p className="mt-1 text-sm font-semibold text-main">ML-KEM-768 + ML-DSA-65 + AES-256-GCM</p>
                </div>
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">Trust Model</p>
                  <p className="mt-1 text-sm font-semibold text-main">Ciphertext-at-rest, client-side decryption</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2" style={{ backgroundColor: 'var(--bg-2)' }}>
              <img src={encryptionFlow} alt="ZeroQ end-to-end encryption flow diagram" className="h-full w-full object-cover" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="card-panel p-7">
            <h4 className="text-main text-xl font-bold">How The Process Works</h4>
            <p className="mt-2 text-sm text-muted">From sender upload to recipient download, security is enforced at each stage.</p>
            <div className="mt-6 space-y-4">
              {processSteps.map((step, index) => (
                <div key={step.title} className="surface-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">Step {index + 1}</p>
                  <h5 className="mt-1 text-base font-semibold text-main">{step.title}</h5>
                  <p className="mt-1 text-sm text-muted leading-6">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-panel p-0 overflow-hidden">
              <img src={threatModel} alt="Threat model showing protected zone and exposed surface" className="w-full object-cover" />
            </div>
            <div className="card-panel p-6">
              <h4 className="text-main text-xl font-bold">Why Hackers Cannot Simply Read Files In Transit</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted leading-6">
                {threatBullets.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="card-panel p-7">
          <h4 className="text-main text-xl font-bold">ZeroQ vs Traditional Sharing Platforms</h4>
          <p className="mt-2 text-sm text-muted">
            This comparison is generalized for typical default setups. Enterprise-customized systems may vary by vendor and policy.
          </p>

          <div className="mt-6 overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--line)' }}>
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead style={{ backgroundColor: 'var(--bg-2)' }}>
                <tr>
                  <th className="px-4 py-3 text-main font-semibold">Security Factor</th>
                  <th className="px-4 py-3 text-main font-semibold">Traditional Cloud Share</th>
                  <th className="px-4 py-3 text-main font-semibold">Email Attachments</th>
                  <th className="px-4 py-3 text-main font-semibold">ZeroQ</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.factor} className="border-t" style={{ borderColor: 'var(--line)' }}>
                    <td className="px-4 py-4 font-medium text-main">{row.factor}</td>
                    <td className="px-4 py-4 text-muted">{row.traditional}</td>
                    <td className="px-4 py-4 text-muted">{row.email}</td>
                    <td className="px-4 py-4 text-main font-semibold">{row.zeroq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
            <img src={platformComparison} alt="Visual comparison of zeroq and traditional sharing platforms" className="w-full object-cover" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-panel p-6">
            <h4 className="text-main text-lg font-bold">Security Strengths</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted leading-6">
              <li>• Browser-side encryption reduces trust on backend infrastructure.</li>
              <li>• Signature verification makes tampering harder to hide.</li>
              <li>• Post-quantum primitives improve future-resilience planning.</li>
              <li>• Key recovery flow supports operational continuity.</li>
            </ul>
          </div>

          <div className="card-panel p-6">
            <h4 className="text-main text-lg font-bold">Operational Limits You Should Know</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted leading-6">
              {limitsBullets.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </VaultLayout>
  )
}
