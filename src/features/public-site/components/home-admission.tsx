import { AdmissionForm, type AdmissionField } from "./admission-form"

export function HomeAdmission({
  admissionEnabled,
  fields,
}: {
  admissionEnabled: boolean
  fields: AdmissionField[]
}) {
  return (
    <section id="pendaftaran" className="scroll-mt-24 bg-violet-800 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">Penerimaan siswa baru</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Mulai perjalanan belajar berikutnya bersama kami.</h2>
          {admissionEnabled
            ? <p className="mt-3 text-sm leading-6 text-violet-100">Isi formulir berikut. Sekolah akan menghubungi orang tua atau wali untuk tahapan selanjutnya.</p>
            : <p className="mt-3 text-sm leading-6 text-violet-100">Pendaftaran saat ini ditutup. Silakan hubungi sekolah untuk informasi lebih lanjut.</p>}
        </div>
        {admissionEnabled && <AdmissionForm fields={fields} />}
      </div>
    </section>
  )
}
