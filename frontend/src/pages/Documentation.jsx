import VaultLayout from '../components/VaultLayout'
import encryptionFlow from '../assets/docs/encryption-flow.svg'
import threatModel from '../assets/docs/threat-model.svg'
import platformComparison from '../assets/docs/platform-comparison.svg'

const processSteps = [
  {
    title: 'Create keys in your browser',
    detail:
      'When you register, ZeroQ creates your keys on your device. Your private keys do not need to be sent to the server in plain form.',
  },
  {
    title: 'Fetch the recipient’s public key',
    detail:
      'When you send a file, the app gets only the recipient’s public key. That key is used to create a shared secret for that transfer.',
  },
  {
    title: 'Encrypt and sign before upload',
    detail:
      'Your browser encrypts the file before it leaves the page. The sender also signs the file so the recipient can confirm it was not changed.',
  },
  {
    title: 'Verify first, then decrypt',
    detail:
      'The recipient checks the signature first and decrypts the file locally only after it passes verification.',
  },
]

const comparisonRows = [
  {
    factor: 'Can the server read your file?',
    traditional: 'Often yes, depending on the service design',
    email: 'Usually yes inside the mailbox system',
    zeroq: 'No, it stores ciphertext only',
  },
  {
    factor: 'Can someone change the file without being noticed?',
    traditional: 'Sometimes, depending on the platform',
    email: 'Attachments usually do not have strong built-in checks',
    zeroq: 'No, signatures help detect tampering',
  },
  {
    factor: 'Is it built for newer cryptography standards?',
    traditional: 'Usually not by default',
    email: 'Usually not by default',
    zeroq: 'Yes, it uses ML-KEM and ML-DSA',
  },
  {
    factor: 'How easy is the security model to understand?',
    traditional: 'Often hidden inside provider policies',
    email: 'Most users never see the full workflow',
    zeroq: 'The app explains the client-side flow clearly',
  },
]

const threatBullets = [
  'Anyone who intercepts traffic only sees encrypted data.',
  'If a file is changed in transit, the signature check can fail before the file opens.',
  'A backend database leak should reveal ciphertext and metadata, not readable file contents.',
  'Only the recipient’s private key can unlock the final file data.',
]

const limitsBullets = [
  'If an attacker controls your device, they may still access local keys or sessions.',
  'Weak passwords still create account risk.',
  'Some metadata, such as sender, receiver, filename, and time, is still visible to the system.',
  'Your recovery secret must be strong and kept safe by you.',
]

const plainLanguageNotes = [
  'Files are encrypted before they leave your browser.',
  'The server stores only encrypted file data.',
  'The recipient checks the sender’s signature before opening the file.',
  'Recovery is possible only with your recovery secret.',
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
