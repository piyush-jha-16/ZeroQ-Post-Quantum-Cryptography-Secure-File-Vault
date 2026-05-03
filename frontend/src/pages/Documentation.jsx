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
      subtitle="A simple explanation of how ZeroQ protects files, what it protects well, and where the limits are."
    >
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="card-panel overflow-hidden p-0">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-stretch lg:p-8">
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Overview</p>
              <h3 className="text-main text-2xl font-extrabold tracking-tight">How ZeroQ keeps file sharing private</h3>
              <p className="mt-4 text-sm text-muted leading-7">
                ZeroQ is designed so your file is locked in your browser before it is uploaded. The server receives only encrypted data, and only the
                recipient’s browser can open it after verifying the sender.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">In simple terms</p>
                  <p className="mt-1 text-sm font-semibold text-main">Upload encrypted. Open only on the recipient’s device.</p>
                </div>
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">What the server sees</p>
                  <p className="mt-1 text-sm font-semibold text-main">Encrypted files, not readable content</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {plainLanguageNotes.map((note) => (
                  <div key={note} className="surface-soft p-4 text-sm text-muted leading-6">
                    {note}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center rounded-2xl bg-[color:var(--bg-2)] p-4 lg:w-[440px] lg:flex-none">
              <img
                src={encryptionFlow}
                alt="ZeroQ end-to-end encryption flow diagram"
                className="h-auto w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="card-panel p-7">
            <h4 className="text-main text-xl font-bold">What happens when you send a file</h4>
            <p className="mt-2 text-sm text-muted">Each step is handled in a way that keeps the file private and easy to verify.</p>
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
            <div className="card-panel overflow-hidden p-0">
              <div className="bg-[color:var(--bg-2)] p-4">
                <img
                  src={threatModel}
                  alt="Threat model showing protected zone and exposed surface"
                  className="h-auto w-full rounded-xl object-contain"
                />
              </div>
            </div>
            <div className="card-panel p-6">
              <h4 className="text-main text-xl font-bold">Why interception does not reveal the file</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted leading-6">
                {threatBullets.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="card-panel p-7">
          <h4 className="text-main text-xl font-bold">How ZeroQ compares with common file-sharing options</h4>
          <p className="mt-2 text-sm text-muted">
            This is a simple comparison for typical default setups. Different providers may offer stronger settings, but those are not always enabled.
          </p>

          <div className="mt-6 overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--line)' }}>
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead style={{ backgroundColor: 'var(--bg-2)' }}>
                <tr>
                  <th className="px-4 py-3 text-main font-semibold">Security Factor</th>
                  <th className="px-4 py-3 text-main font-semibold">Traditional Cloud Sharing</th>
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

          <div className="mt-6 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--line)' }}>
            <div className="bg-[color:var(--bg-2)] p-4">
              <img
                src={platformComparison}
                alt="Visual comparison of zeroq and traditional sharing platforms"
                className="h-auto w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-panel p-6">
            <h4 className="text-main text-lg font-bold">What ZeroQ does well</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted leading-6">
              <li>• It reduces trust in the backend by encrypting files in the browser.</li>
              <li>• It checks for tampering before a file is opened.</li>
              <li>• It uses newer post-quantum cryptography building blocks.</li>
              <li>• It includes a recovery flow so users can regain access when needed.</li>
            </ul>
          </div>

          <div className="card-panel p-6">
            <h4 className="text-main text-lg font-bold">Important limits to keep in mind</h4>
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
