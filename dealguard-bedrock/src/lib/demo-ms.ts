import type { DraftKind } from "./prompts";
import type { Lang } from "./types";

// Bahasa Malaysia version of the demo-mode sample analysis, keyed by the English
// text in demo.ts and demo-provisions.ts. Quotes from the sample documents and the
// proposed clause wording stay in English, as they do in a live run.
// Have a native speaker review before a public launch.

/** Replace every string in a demo value that has a Bahasa Malaysia version. */
export function localizeDemo<T>(value: T, lang: Lang | undefined): T {
  if (lang !== "ms") return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return DEMO_MS[v] ?? v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "quote" || k === "proposed_wording" ? x : walk(x)]));
    return v;
  };
  return walk(value) as T;
}

export const DEMO_MS: Record<string, string> = {
  // ── Fact ledger
  "Main contractor is Contoh Bina Sdn Bhd; the employer is Contoh Development Sdn Bhd.": "Kontraktor utama ialah Contoh Bina Sdn Bhd; majikan ialah Contoh Development Sdn Bhd.",
  "Awarded as a lump sum of RM 2,400,000, inclusive of preliminaries, attendance and testing.": "Ditawarkan secara lump sum RM 2,400,000, termasuk preliminaries, attendance dan ujian.",
  "The BQ total carried to tender is RM 2,361,600.": "Jumlah BQ yang dibawa ke tender ialah RM 2,361,600.",
  "BQ quantities are provisional and subject to remeasurement on completion.": "Kuantiti BQ adalah sementara dan akan diukur semula apabila kerja siap.",
  "Load tests (RM 76,000) and integrity tests (RM 42,000) are provisional BQ items.": "Ujian beban (RM 76,000) dan ujian integriti (RM 42,000) ialah item sementara dalam BQ.",
  "Completion within 16 weeks of site possession, expected 3 November 2026.": "Siap dalam 16 minggu dari tarikh milikan tapak, dijangka 3 November 2026.",
  "Works must follow the contractor's master programme as updated from time to time.": "Kerja mesti mengikut program induk kontraktor yang dikemas kini dari semasa ke semasa.",
  "No advance payment is offered.": "Tiada bayaran pendahuluan ditawarkan.",
  "Progress claims can be submitted once a month.": "Tuntutan kemajuan boleh dihantar sebulan sekali.",
  "The contractor has 21 days to assess and certify a claim.": "Kontraktor ada 21 hari untuk menilai dan memperakui tuntutan.",
  "Payment is due 60 days after certification.": "Bayaran perlu dibuat 60 hari selepas perakuan.",
  "Payment is conditional on the contractor being paid by the employer (pay-when-paid).": "Bayaran bergantung pada kontraktor dibayar oleh majikan (pay-when-paid).",
  "The contractor may set off any amount it claims under this or any other contract between the parties.": "Kontraktor boleh menolak apa-apa jumlah yang dituntutnya di bawah kontrak ini atau kontrak lain antara kedua-dua pihak.",
  "Retention is 10% of each payment, limited to 5% of the subcontract sum.": "Wang tahanan ialah 10% daripada setiap bayaran, dihadkan kepada 5% daripada jumlah subkontrak.",
  "Retention is released half at the Main Contract CPC and half at the Main Contract CMGD.": "Separuh wang tahanan dilepaskan semasa CPC Kontrak Utama dan separuh lagi semasa CMGD Kontrak Utama.",
  "A 5% unconditional on-demand bond is required, valid until 12 months after the Main Contract defects period.": "Bon on-demand tanpa syarat sebanyak 5% diperlukan, sah sehingga 12 bulan selepas tempoh kecacatan Kontrak Utama.",
  "LAD is RM 8,000 per calendar day.": "LAD ialah RM 8,000 bagi setiap hari kalendar.",
  "The subcontractor also indemnifies the contractor against employer LAD caused by the subcontractor.": "Subkontraktor juga menanggung rugi kontraktor bagi LAD majikan yang disebabkan oleh subkontraktor.",
  "Written notice within 7 days of a delay event is a condition precedent to EOT.": "Notis bertulis dalam 7 hari selepas kejadian kelewatan ialah syarat wajib untuk mendapat EOT.",
  "EOT is only granted to the extent the employer grants the contractor a corresponding EOT.": "EOT hanya diberi setakat majikan memberi EOT yang sepadan kepada kontraktor.",
  "The defects period is 24 months from practical completion of the Main Contract Works.": "Tempoh kecacatan ialah 24 bulan dari penyiapan praktikal Kerja Kontrak Utama.",
  "No claim is allowed for unforeseen ground conditions, obstructions or boulders.": "Tiada tuntutan dibenarkan bagi keadaan tanah yang tidak dijangka, halangan atau batu tongkol.",
  "The contractor provides access roads and a working platform.": "Kontraktor menyediakan jalan masuk dan platform kerja.",
  "Variations are only valid if instructed in writing and signed by a Director of the contractor.": "Perubahan kerja hanya sah jika diarahkan secara bertulis dan ditandatangani oleh Pengarah kontraktor.",
  "Variation claims must be submitted within 14 days or are waived.": "Tuntutan perubahan kerja mesti dihantar dalam 14 hari, jika tidak ia dianggap dilepaskan.",
  "Where BQ rates don't apply, the contractor sets the rate.": "Jika kadar BQ tidak terpakai, kontraktor yang menetapkan kadar.",
  "The contractor may terminate for convenience on 7 days' notice with no loss of profit.": "Kontraktor boleh menamatkan kontrak atas kehendaknya dengan notis 7 hari, tanpa bayaran untuk kehilangan untung.",
  "The subcontractor may not suspend or slow down, even for non-payment.": "Subkontraktor tidak boleh menggantung atau memperlahankan kerja, walaupun tidak dibayar.",
  "Arbitration (AIAC, Kuala Lumpur) only after completion of the Main Contract Works.": "Timbang tara (AIAC, Kuala Lumpur) hanya selepas Kerja Kontrak Utama siap.",
  "Payment disputes can still go to CIPAA adjudication.": "Pertikaian bayaran masih boleh dibawa ke adjudikasi CIPAA.",
  "The subcontractor bears a RM 50,000 deductible per CAR claim arising from its works.": "Subkontraktor menanggung ekses RM 50,000 bagi setiap tuntutan CAR yang berpunca daripada kerjanya.",
  "Certified amounts paid late attract 5% per annum interest.": "Jumlah diperakui yang dibayar lewat dikenakan faedah 5% setahun.",
  "On any conflict between documents, the contractor's interpretation prevails.": "Jika dokumen bercanggah, tafsiran kontraktor yang terpakai.",
  "Main Contract conditions are deemed incorporated so far as applicable.": "Syarat Kontrak Utama dianggap dimasukkan setakat yang berkenaan.",
  "The subcontract conditions are Revision B, marked draft for discussion.": "Syarat subkontrak ialah Semakan B, ditanda sebagai draf untuk perbincangan.",
  "The LOA must be signed and returned within 3 days.": "LOA mesti ditandatangani dan dipulangkan dalam 3 hari.",

  // ── Gaps
  "No cap on LAD or on the employer-LAD indemnity.": "Tiada had bagi LAD atau bagi tanggung rugi LAD majikan.",
  "No payment for demobilisation, materials ordered or lost profit on termination for convenience.": "Tiada bayaran untuk demobilisasi, bahan yang telah dipesan atau kehilangan untung jika kontrak ditamatkan atas kehendak kontraktor.",
  "Main Contract conditions are incorporated but were not provided.": "Syarat Kontrak Utama dimasukkan tetapi tidak diberikan.",
  "No drawings, pile layout, specification or soil investigation report in the package.": "Tiada lukisan, susun atur cerucuk, spesifikasi atau laporan penyiasatan tanah dalam pakej.",

  // ── Intake
  "Letter of Award": "Surat Tawaran (LOA)",
  "Subcontract Conditions": "Syarat Subkontrak",
  "Bill of Quantities (summary)": "Senarai Kuantiti (ringkasan)",
  "Issued and signed by Contoh Bina; awaiting your acceptance within 3 days.": "Dikeluarkan dan ditandatangani oleh Contoh Bina; menunggu penerimaan anda dalam 3 hari.",
  "Revision B, marked draft for discussion; sets payment, EOT, LAD, termination and dispute terms.": "Semakan B, ditanda draf untuk perbincangan; menetapkan terma bayaran, EOT, LAD, penamatan dan pertikaian.",
  "Remeasurable BQ totalling RM 2,361,600 with provisional testing items.": "BQ yang diukur semula berjumlah RM 2,361,600 dengan item ujian sementara.",
  "Main Contract conditions": "Syarat Kontrak Utama",
  "Incorporated by the LOA and drive your EOT, LAD and payment position, but not provided.": "Dimasukkan melalui LOA dan menentukan kedudukan EOT, LAD dan bayaran anda, tetapi tidak diberikan.",
  "Pile layout drawings and specification": "Lukisan susun atur cerucuk dan spesifikasi",
  "Scope refers to the contractor's drawings; quantities can't be checked without them.": "Skop merujuk lukisan kontraktor; kuantiti tidak dapat disemak tanpanya.",
  "Soil investigation report": "Laporan penyiasatan tanah",
  "You carry all ground-condition risk under clause 5.2.": "Anda menanggung semua risiko keadaan tanah di bawah klausa 5.2.",
  "Contractor's master programme": "Program induk kontraktor",
  "Clause 14.1 binds you to it as updated from time to time.": "Klausa 14.1 mengikat anda kepadanya seperti yang dikemas kini dari semasa ke semasa.",
  "No fixed order of precedence: clause 1.3 lets the contractor's interpretation prevail on any conflict, and the LOA deems the Main Contract conditions incorporated.": "Tiada susunan keutamaan yang tetap: klausa 1.3 membenarkan tafsiran kontraktor terpakai dalam apa-apa percanggahan, dan LOA menganggap syarat Kontrak Utama dimasukkan.",

  // ── Specialist summaries and protections
  "Getting paid is the biggest problem. You wait up to 81 days per claim, you only get paid after they do, and they can deduct money from other jobs.": "Mendapat bayaran ialah masalah terbesar. Anda menunggu sehingga 81 hari bagi setiap tuntutan, anda hanya dibayar selepas mereka dibayar, dan mereka boleh menolak wang daripada kerja lain.",
  "Interest on late payment": "Faedah atas bayaran lewat",
  "Certified amounts paid late earn 5% a year, which helps when chasing payment.": "Jumlah diperakui yang dibayar lewat mendapat faedah 5% setahun, yang membantu semasa menuntut bayaran.",
  "CIPAA adjudication is kept": "Adjudikasi CIPAA dikekalkan",
  "You can still take a payment dispute to adjudication without waiting for arbitration.": "Anda masih boleh membawa pertikaian bayaran ke adjudikasi tanpa menunggu timbang tara.",
  "The work is clear, but you carry all the ground risk, extra work is hard to get paid for, and the lump sum and BQ don't match.": "Kerjanya jelas, tetapi anda menanggung semua risiko tanah, kerja tambahan sukar dituntut, dan jumlah lump sum tidak sama dengan BQ.",
  "They provide access roads and the working platform": "Mereka menyediakan jalan masuk dan platform kerja",
  "Platform preparation, often a disputed cost on piling jobs, is theirs.": "Penyediaan platform, yang sering dipertikaikan kosnya dalam kerja cerucuk, ditanggung mereka.",
  "Time is the second big risk: you only get extra time if the employer grants it, a late notice loses it, and delay penalties have no cap.": "Masa ialah risiko besar kedua: anda hanya dapat masa tambahan jika majikan memberinya, notis yang lewat menghilangkannya, dan penalti kelewatan tiada had.",
  "Clear 16-week period": "Tempoh 16 minggu yang jelas",
  "The LOA fixes the duration from site possession.": "LOA menetapkan tempoh dari tarikh milikan tapak.",
  "Exit terms favour Contoh Bina: they can end the job at 7 days' notice and you can't stop work when unpaid. Bond and insurance terms are standard.": "Terma penamatan memihak kepada Contoh Bina: mereka boleh menamatkan kerja dengan notis 7 hari dan anda tidak boleh berhenti kerja walaupun tidak dibayar. Terma bon dan insurans adalah biasa.",
  "Payment disputes can go to adjudication": "Pertikaian bayaran boleh dibawa ke adjudikasi",
  "Clause 21.2 keeps your CIPAA route open.": "Klausa 21.2 mengekalkan laluan CIPAA anda.",
  "The paperwork is incomplete and one-sided: a draft contract, an unseen main contract, and Contoh Bina's interpretation wins every conflict.": "Dokumen tidak lengkap dan berat sebelah: kontrak masih draf, kontrak utama belum dilihat, dan tafsiran Contoh Bina menang dalam setiap percanggahan.",

  // ── Decision
  "Don't sign yet. On these terms you'd fund almost the whole job yourself, far beyond your RM 300k, and delays could cost you without limit.": "Jangan tandatangan lagi. Dengan terma ini anda membiayai hampir keseluruhan kerja sendiri, jauh melebihi RM 300k anda, dan kelewatan boleh merugikan anda tanpa had.",
  "The job is workable, but the terms push the cash, ground and delay risk onto you. Fix payment and the delay penalties first; most of the rest is commonly negotiated.": "Kerja ini boleh dibuat, tetapi termanya meletakkan risiko tunai, tanah dan kelewatan pada anda. Betulkan bayaran dan penalti kelewatan dahulu; kebanyakan yang lain lazimnya boleh dirunding.",
  "Main Contract conditions (payment, EOT, LAD, defects)": "Syarat Kontrak Utama (bayaran, EOT, LAD, kecacatan)",
  "They are incorporated into your subcontract and drive your EOT and LAD exposure.": "Ia dimasukkan ke dalam subkontrak anda dan menentukan pendedahan EOT dan LAD anda.",
  "Final subcontract conditions (not the Rev B draft)": "Syarat subkontrak muktamad (bukan draf Rev B)",
  "You would be accepting terms that may still change.": "Anda akan menerima terma yang masih boleh berubah.",
  "Soil investigation report and pile layout drawings": "Laporan penyiasatan tanah dan lukisan susun atur cerucuk",
  "To price ground risk and check BQ quantities.": "Untuk menilai harga risiko tanah dan menyemak kuantiti BQ.",
  "Contoh Bina / Employer's consultant": "Contoh Bina / Perunding majikan",
  "Master programme": "Program induk",
  "You are bound to it as updated from time to time.": "Anda terikat kepadanya seperti yang dikemas kini dari semasa ke semasa.",
  "Counterparty checks (SSM, CIDB grade, credit report)": "Semakan rakan kontrak (SSM, gred CIDB, laporan kredit)",
  "No track record with this contractor.": "Tiada rekod kerja dengan kontraktor ini.",
  "Your own checks": "Semakan anda sendiri",
  "Core payment, time and LAD terms are clear and quoted from the documents.": "Terma utama bayaran, masa dan LAD adalah jelas dan dipetik daripada dokumen.",
  "The Main Contract is incorporated but not provided, so some obligations are unseen.": "Kontrak Utama dimasukkan tetapi tidak diberikan, jadi sebahagian kewajipan belum dilihat.",
  "The subcontract conditions are still a draft.": "Syarat subkontrak masih draf.",
  "BQ quantities are provisional, so the final value may move.": "Kuantiti BQ adalah sementara, jadi nilai akhir mungkin berubah.",

  // ── Contract breakdown: shared
  "Not a walk-away point on its own. Weigh it with the others.": "Bukan sebab untuk tarik diri dengan sendirinya. Timbang bersama perkara lain.",

  // parties
  "New main contractor, no track record with you": "Kontraktor utama baharu, tiada rekod kerja dengan anda",
  "Contoh Bina Sdn Bhd is the main contractor and Contoh Development Sdn Bhd the employer. You haven't worked with Contoh Bina before.": "Contoh Bina Sdn Bhd ialah kontraktor utama dan Contoh Development Sdn Bhd ialah majikan. Anda belum pernah bekerja dengan Contoh Bina.",
  "Check any new main contractor before signing": "Semak mana-mana kontraktor utama baharu sebelum tandatangan",
  "First job with Contoh Bina": "Kerja pertama dengan Contoh Bina",
  "Run an SSM search, CIDB check and credit report on Contoh Bina": "Buat carian SSM, semakan CIDB dan laporan kredit ke atas Contoh Bina",
  "before accepting the LOA": "sebelum menerima LOA",
  "Ask two of their current subcontractors how they pay": "Tanya dua subkontraktor semasa mereka tentang cara mereka membayar",

  // documents
  "You'd sign a draft and a contract you haven't seen": "Anda akan tandatangan draf dan kontrak yang belum anda lihat",
  "The subcontract conditions are a draft (Rev B), the main contract is included without being shown to you, and you must accept within 3 days.": "Syarat subkontrak masih draf (Rev B), kontrak utama dimasukkan tanpa ditunjukkan kepada anda, dan anda mesti terima dalam 3 hari.",
  "Final terms, all documents provided, 7–14 days to review": "Terma muktamad, semua dokumen diberikan, 7–14 hari untuk menyemak",
  "Draft terms, main contract unseen, 3 days to accept": "Terma draf, kontrak utama belum dilihat, 3 hari untuk terima",
  "You could be bound by rules you've never read, and the draft can still change after you accept.": "Anda boleh terikat dengan syarat yang tidak pernah anda baca, dan draf masih boleh berubah selepas anda terima.",
  "Final conditions and the main contract's payment, delay and LAD clauses, plus 14 days to review.": "Syarat muktamad dan klausa bayaran, kelewatan dan LAD kontrak utama, serta 14 hari untuk menyemak.",
  "The key main-contract clauses and 7 days to review.": "Klausa utama kontrak utama dan 7 hari untuk menyemak.",
  "They refuse to show any main-contract terms.": "Mereka enggan menunjukkan apa-apa terma kontrak utama.",
  "We're keen to proceed, but we need the final conditions and the main-contract clauses that bind us before we accept.": "Kami berminat untuk meneruskan, tetapi kami perlukan syarat muktamad dan klausa kontrak utama yang mengikat kami sebelum kami terima.",
  "Sign and return the LOA if you accept": "Tandatangan dan pulangkan LOA jika anda terima",
  "within 3 days of 2 October 2026": "dalam 3 hari dari 2 Oktober 2026",
  "Get the main contract clauses and final conditions": "Dapatkan klausa kontrak utama dan syarat muktamad",
  "before accepting": "sebelum terima",

  // precedence
  "They decide what the contract means": "Mereka yang menentukan maksud kontrak",
  "Clause 1.3 says that if documents conflict, Contoh Bina's interpretation wins. The LOA and BQ already conflict.": "Klausa 1.3 menyatakan jika dokumen bercanggah, tafsiran Contoh Bina yang menang. LOA dan BQ sudah pun bercanggah.",
  "A fixed order of documents decides conflicts": "Susunan dokumen yang tetap menentukan percanggahan",
  "Contoh Bina's interpretation wins every conflict": "Tafsiran Contoh Bina menang dalam setiap percanggahan",
  "Every unclear point in this package will be settled their way, including how much you get paid.": "Setiap perkara yang tidak jelas dalam pakej ini akan diputuskan mengikut cara mereka, termasuk berapa anda dibayar.",
  "A fixed order: LOA, Subcontract Conditions, BQ, your quotation.": "Susunan tetap: LOA, Syarat Subkontrak, BQ, sebut harga anda.",
  "A fixed order, even if their conditions come first.": "Susunan tetap, walaupun syarat mereka didahulukan.",
  "They insist on keeping 'Contractor's interpretation shall prevail'.": "Mereka berkeras mengekalkan 'Contractor's interpretation shall prevail'.",
  "Can we replace clause 1.3 with a fixed order of documents, so we both know how conflicts are settled?": "Boleh kita gantikan klausa 1.3 dengan susunan dokumen yang tetap, supaya kedua-dua pihak tahu cara percanggahan diselesaikan?",

  // sum_basis
  "Lump sum and BQ don't match": "Lump sum dan BQ tidak sama",
  "The LOA says RM 2,400,000 lump sum including testing. The BQ adds up to RM 2,361,600 and will be remeasured.": "LOA menyatakan lump sum RM 2,400,000 termasuk ujian. BQ berjumlah RM 2,361,600 dan akan diukur semula.",
  "One clear basis: lump sum or remeasured": "Satu asas yang jelas: lump sum atau diukur semula",
  "Both, RM 38,400 apart": "Kedua-duanya, berbeza RM 38,400",
  "It's unclear whether you're paid the fixed sum or the measured work, which affects every claim.": "Tidak jelas sama ada anda dibayar jumlah tetap atau kerja yang diukur, dan ini menjejaskan setiap tuntutan.",
  "Difference between the LOA sum and BQ total": "Beza antara jumlah LOA dan jumlah BQ",
  "Confirm the work is remeasured at BQ rates, with testing paid as measured.": "Sahkan kerja diukur semula pada kadar BQ, dengan ujian dibayar mengikut ukuran.",
  "A lump sum, with extra testing paid at BQ rates.": "Lump sum, dengan ujian tambahan dibayar pada kadar BQ.",
  "They want a fixed sum but keep the right to remeasure down.": "Mereka mahu jumlah tetap tetapi mengekalkan hak untuk mengukur semula ke bawah.",
  "Please confirm in writing whether we're paid on remeasurement at BQ rates, and how the RM 38,400 difference is treated.": "Sila sahkan secara bertulis sama ada kami dibayar mengikut ukuran semula pada kadar BQ, dan bagaimana beza RM 38,400 itu dikira.",
  "Keep signed records for every pile and empty bore": "Simpan rekod bertandatangan bagi setiap cerucuk dan empty bore",
  "as work proceeds": "semasa kerja berjalan",

  // scope
  "Scope is clear; platform provided by them": "Skop jelas; platform disediakan oleh mereka",
  "Bored piling and empty bore works to their drawings, including testing. They provide access roads and the working platform; you remove spoil.": "Kerja bored piling dan empty bore mengikut lukisan mereka, termasuk ujian. Mereka menyediakan jalan masuk dan platform kerja; anda membuang tanah korekan.",
  "Contractor provides access and platform": "Kontraktor menyediakan jalan masuk dan platform",
  "Check the pile layout drawings against the BQ": "Semak lukisan susun atur cerucuk dengan BQ",

  // site_conditions
  "You carry all the ground risk": "Anda menanggung semua risiko tanah",
  "You're treated as having inspected the site and can't claim for unforeseen ground, obstructions or boulders.": "Anda dianggap telah memeriksa tapak dan tidak boleh menuntut bagi keadaan tanah yang tidak dijangka, halangan atau batu tongkol.",
  "Obstructions paid at an agreed rate": "Halangan dibayar pada kadar yang dipersetujui",
  "No claim for ground conditions or boulders": "Tiada tuntutan untuk keadaan tanah atau batu tongkol",
  "Boulders are the most common overrun on bored piling. A few days of chiselling can wipe out your margin.": "Batu tongkol ialah punca lebihan kos paling biasa dalam bored piling. Beberapa hari memahat boleh menghabiskan margin anda.",
  "An agreed rate for obstructions and chiselling, plus the soil investigation report.": "Kadar yang dipersetujui untuk halangan dan kerja memahat, serta laporan penyiasatan tanah.",
  "You absorb the first 8 hours per pile, then the rate applies.": "Anda menanggung 8 jam pertama bagi setiap cerucuk, selepas itu kadar terpakai.",
  "They refuse to share the soil report and refuse any rate.": "Mereka enggan berkongsi laporan tanah dan menolak sebarang kadar.",
  "Without the soil report we can't price boulders. Can we agree a rate for obstructions instead?": "Tanpa laporan tanah kami tidak dapat menilai harga batu tongkol. Boleh kita persetujui satu kadar untuk halangan?",
  "Get and read the soil investigation report": "Dapatkan dan baca laporan penyiasatan tanah",
  "Photograph and log every obstruction and tell them in writing": "Ambil gambar dan rekod setiap halangan, dan maklumkan mereka secara bertulis",

  // interim_claims
  "Monthly claims, certified in 21 days": "Tuntutan bulanan, diperakui dalam 21 hari",
  "You claim once a month and Contoh Bina has 21 days to certify each claim.": "Anda menuntut sebulan sekali dan Contoh Bina ada 21 hari untuk memperakui setiap tuntutan.",
  "Monthly claims, certified within 21 days": "Tuntutan bulanan, diperakui dalam 21 hari",
  "Submit a progress claim with measurement records": "Hantar tuntutan kemajuan bersama rekod ukuran",
  "once every calendar month": "sekali setiap bulan kalendar",
  "Chase the certificate if it hasn't arrived": "Susuli perakuan jika belum diterima",
  "21 days after each claim": "21 hari selepas setiap tuntutan",

  // payment_period
  "You wait up to 81 days to get paid": "Anda menunggu sehingga 81 hari untuk dibayar",
  "Payment is due 60 days after certification, so up to 81 days after you claim. Late payment earns 5% a year.": "Bayaran perlu dibuat 60 hari selepas perakuan, iaitu sehingga 81 hari selepas anda menuntut. Bayaran lewat mendapat faedah 5% setahun.",
  "Paid within 30 days of certification": "Dibayar dalam 30 hari selepas perakuan",
  "Paid 60 days after certification": "Dibayar 60 hari selepas perakuan",
  "You fund the work for almost three months per claim. On this job that means about RM 1.9M more than you have.": "Anda membiayai kerja hampir tiga bulan bagi setiap tuntutan. Untuk kerja ini, itu bermakna kira-kira RM 1.9J lebih daripada yang anda ada.",
  "Extra cash you'd need before payments catch up": "Tunai tambahan yang anda perlukan sebelum bayaran masuk mengejar",
  "Payment within 30 days of certification.": "Bayaran dalam 30 hari selepas perakuan.",
  "45 days, with fortnightly claims for the first two months.": "45 hari, dengan tuntutan dua minggu sekali untuk dua bulan pertama.",
  "They won't move from 60 days and won't give an advance.": "Mereka tidak mahu berganjak daripada 60 hari dan tidak mahu memberi pendahuluan.",
  "We can't carry 81 days of cost on a job this size. Can we agree payment within 30 days of certification?": "Kami tidak mampu menanggung kos 81 hari untuk kerja sebesar ini. Boleh kita persetujui bayaran dalam 30 hari selepas perakuan?",
  "Send a reminder and claim interest if payment is late": "Hantar peringatan dan tuntut faedah jika bayaran lewat",
  "60 days after certification": "60 hari selepas perakuan",
  "If still unpaid, start a CIPAA payment claim": "Jika masih belum dibayar, mulakan tuntutan bayaran CIPAA",

  // conditional_payment
  "You only get paid after they get paid": "Anda hanya dibayar selepas mereka dibayar",
  "Contoh Bina doesn't have to pay you until the employer pays them, with no end date.": "Contoh Bina tidak perlu membayar anda sehingga majikan membayar mereka, tanpa tarikh akhir.",
  "Paid on a fixed date, whatever the employer does": "Dibayar pada tarikh tetap, tidak kira apa majikan buat",
  "Paid only when the employer pays them": "Dibayar hanya apabila majikan membayar mereka",
  "If the employer pays late or never, your money is stuck too. It's void under CIPAA, but you'd have to go to adjudication to prove it.": "Jika majikan bayar lewat atau tidak bayar langsung, wang anda juga tersekat. Ia tidak sah di bawah CIPAA, tetapi anda perlu ke adjudikasi untuk membuktikannya.",
  "About one monthly claim held up": "Kira-kira satu tuntutan bulanan tertahan",
  "Delete the 'until the Employer pays' condition completely.": "Buang sepenuhnya syarat 'sehingga Majikan membayar'.",
  "A fixed final date: paid within 30 days of the due date regardless.": "Tarikh akhir yang tetap: dibayar dalam 30 hari selepas tarikh perlu bayar, tidak kira apa pun.",
  "They insist on pay-when-paid with no final date.": "Mereka berkeras dengan pay-when-paid tanpa tarikh akhir.",
  "We can't carry the employer's payment risk. Please delete the pay-when-paid proviso; it's void under CIPAA anyway.": "Kami tidak mampu menanggung risiko bayaran majikan. Sila buang syarat pay-when-paid; ia memang tidak sah di bawah CIPAA.",
  "If they hold back payment because the employer hasn't paid, reply in writing that this is void under CIPAA s.35": "Jika mereka menahan bayaran kerana majikan belum bayar, balas secara bertulis bahawa ini tidak sah di bawah CIPAA s.35",

  // set_off
  "They can deduct money from any job": "Mereka boleh menolak wang daripada mana-mana kerja",
  "Contoh Bina can deduct anything it claims against you, under this or any other contract, with no notice.": "Contoh Bina boleh menolak apa sahaja yang dituntutnya terhadap anda, di bawah kontrak ini atau kontrak lain, tanpa notis.",
  "Deductions only for agreed amounts on this job, with notice": "Tolakan hanya untuk jumlah yang dipersetujui bagi kerja ini, dengan notis",
  "Any claimed amount, any contract, no notice": "Apa-apa jumlah dituntut, mana-mana kontrak, tanpa notis",
  "A dispute on another job could wipe out a payment on this one, without warning.": "Pertikaian dalam kerja lain boleh menghapuskan bayaran untuk kerja ini, tanpa amaran.",
  "Deductions only for certified or agreed amounts on this subcontract, with 14 days' written notice.": "Tolakan hanya untuk jumlah yang diperakui atau dipersetujui di bawah subkontrak ini, dengan notis bertulis 14 hari.",
  "This subcontract only, with 7 days' notice.": "Subkontrak ini sahaja, dengan notis 7 hari.",
  "Can we limit set-off to agreed amounts on this subcontract, with written notice first?": "Boleh kita hadkan tolakan kepada jumlah yang dipersetujui di bawah subkontrak ini, dengan notis bertulis terlebih dahulu?",

  // retention
  "Retention is standard; release is slow": "Wang tahanan adalah biasa; pelepasannya lambat",
  "10% of each payment, up to 5% of the sum (RM 120,000). Half comes back at Main Contract completion, half after defects.": "10% daripada setiap bayaran, sehingga 5% daripada jumlah kontrak (RM 120,000). Separuh dipulangkan semasa Kontrak Utama siap, separuh selepas tempoh kecacatan.",
  "10% retention, capped at 5% of the sum": "Wang tahanan 10%, dihadkan kepada 5% daripada jumlah",
  "10% capped at 5%, released on the Main Contract": "10% dihadkan kepada 5%, dilepaskan mengikut Kontrak Utama",
  "Track the Main Contract completion and defects certificates and claim each release": "Pantau perakuan siap dan perakuan kecacatan Kontrak Utama dan tuntut setiap pelepasan",
  "on issue of each certificate": "apabila setiap perakuan dikeluarkan",

  // advance
  "No advance for a costly mobilisation": "Tiada pendahuluan untuk mobilisasi yang mahal",
  "No advance payment is offered, so rig mobilisation and the first month are on you.": "Tiada bayaran pendahuluan ditawarkan, jadi mobilisasi rig dan bulan pertama ditanggung anda.",
  "10% advance against a bond on large packages": "Pendahuluan 10% dengan bon bagi pakej besar",
  "No advance": "Tiada pendahuluan",
  "With 81 days to first payment and no advance, your RM 300k runs out early.": "Dengan 81 hari sebelum bayaran pertama dan tanpa pendahuluan, RM 300k anda habis awal.",
  "A 10% advance you'd fund yourself": "Pendahuluan 10% yang anda biayai sendiri",
  "A 10% advance (RM 240,000) against an advance payment bond.": "Pendahuluan 10% (RM 240,000) dengan bon bayaran pendahuluan.",
  "A mobilisation payment covering prelims (RM 145,000).": "Bayaran mobilisasi yang meliputi prelims (RM 145,000).",
  "No advance and no faster payment.": "Tiada pendahuluan dan tiada bayaran yang lebih cepat.",
  "Could we agree a 10% advance against an advance payment bond, recovered from our claims?": "Boleh kita persetujui pendahuluan 10% dengan bon bayaran pendahuluan, yang ditolak daripada tuntutan kami?",

  // variations
  "Only a Director can order extra work": "Hanya Pengarah boleh mengarahkan kerja tambahan",
  "A variation counts only if a Director of Contoh Bina signs it in writing.": "Perubahan kerja hanya dikira jika Pengarah Contoh Bina menandatanganinya secara bertulis.",
  "Site manager's written instruction, confirmed later": "Arahan bertulis pengurus tapak, disahkan kemudian",
  "Director's signature needed": "Tandatangan Pengarah diperlukan",
  "Extra work ordered on site by their team may never be paid.": "Kerja tambahan yang diarahkan di tapak oleh pasukan mereka mungkin tidak dibayar langsung.",
  "Accept written instructions from the project manager, confirmed within 7 days.": "Terima arahan bertulis daripada pengurus projek, disahkan dalam 7 hari.",
  "Director confirmation within 7 days, or the instruction stands.": "Pengesahan Pengarah dalam 7 hari, jika tidak arahan itu kekal sah.",
  "Can site instructions from your project manager count, as long as they're confirmed within 7 days?": "Boleh arahan tapak daripada pengurus projek tuan dikira sah, asalkan disahkan dalam 7 hari?",
  "Don't start extra work without a signed written instruction": "Jangan mulakan kerja tambahan tanpa arahan bertulis yang ditandatangani",
  "before starting the work": "sebelum memulakan kerja",

  // variation_valuation
  "Miss 14 days and you lose the claim": "Terlepas 14 hari, anda hilang tuntutan",
  "Claims for extra work must be sent within 14 days or you lose them, and they set the rate for new items.": "Tuntutan kerja tambahan mesti dihantar dalam 14 hari atau anda kehilangannya, dan mereka yang menetapkan kadar bagi item baharu.",
  "30 days to claim, rates agreed": "30 hari untuk menuntut, kadar dipersetujui bersama",
  "14 days or lose it; they set rates": "14 hari atau hilang; mereka tetapkan kadar",
  "One busy fortnight on site and you lose payment for extra work you've already done.": "Dua minggu yang sibuk di tapak dan anda kehilangan bayaran untuk kerja tambahan yang sudah anda siapkan.",
  "30 days to claim with no loss of entitlement; new rates by agreement or cost plus 15%.": "30 hari untuk menuntut tanpa kehilangan hak; kadar baharu melalui persetujuan atau kos tambah 15%.",
  "21 days to claim; new rates by agreement.": "21 hari untuk menuntut; kadar baharu melalui persetujuan.",
  "Can we extend the variation claim period to 30 days, and agree new rates together?": "Boleh kita lanjutkan tempoh tuntutan perubahan kerja kepada 30 hari, dan persetujui kadar baharu bersama?",
  "Send each variation claim with costs and backup": "Hantar setiap tuntutan perubahan kerja bersama kos dan dokumen sokongan",
  "within 14 days of the instruction": "dalam 14 hari selepas arahan",

  // completion
  "16 weeks from site possession": "16 minggu dari milikan tapak",
  "Complete within 16 weeks from possession (expected 3 November 2026), following their master programme as updated.": "Siap dalam 16 minggu dari milikan tapak (dijangka 3 November 2026), mengikut program induk mereka yang dikemas kini.",
  "Fixed period from possession": "Tempoh tetap dari milikan tapak",
  "16 weeks from possession": "16 minggu dari milikan tapak",
  "Confirm the actual possession date in writing": "Sahkan tarikh sebenar milikan tapak secara bertulis",
  "on the day of possession": "pada hari milikan tapak",
  "Get the current master programme": "Dapatkan program induk terkini",
  "before mobilising": "sebelum mobilisasi",

  // eot
  "You may get no extra time for delays you didn't cause": "Anda mungkin tidak dapat masa tambahan bagi kelewatan yang bukan salah anda",
  "Delay notices must reach them within 7 days or you lose the right to extra time, and you only get time if the employer gives them time first.": "Notis kelewatan mesti sampai kepada mereka dalam 7 hari atau anda hilang hak masa tambahan, dan anda hanya dapat masa jika majikan memberi mereka masa dahulu.",
  "Extra time for any delay you didn't cause": "Masa tambahan bagi apa-apa kelewatan yang bukan salah anda",
  "Only if the employer grants it to them, and only with notice in 7 days": "Hanya jika majikan memberinya kepada mereka, dan hanya dengan notis dalam 7 hari",
  "If other trades or Contoh Bina delay you, you could still pay RM 8,000 a day in penalties.": "Jika kontraktor lain atau Contoh Bina melewatkan anda, anda masih boleh dikenakan penalti RM 8,000 sehari.",
  "30 days of delay at the LAD rate": "30 hari kelewatan pada kadar LAD",
  "Extra time for any delay not caused by you, with 14 days to give notice.": "Masa tambahan bagi apa-apa kelewatan yang bukan disebabkan anda, dengan 14 hari untuk memberi notis.",
  "Time linked to the employer's decision, but always for delays Contoh Bina causes.": "Masa bergantung pada keputusan majikan, tetapi sentiasa diberi bagi kelewatan yang disebabkan Contoh Bina.",
  "Back-to-back time only, with the 7-day forfeit kept.": "Masa back-to-back sahaja, dengan syarat lucut hak 7 hari dikekalkan.",
  "We need extra time for any delay we don't cause, not only when the employer grants it to you.": "Kami perlukan masa tambahan bagi apa-apa kelewatan yang bukan salah kami, bukan hanya apabila majikan memberinya kepada tuan.",
  "Tell them in writing about every delay": "Maklumkan mereka secara bertulis tentang setiap kelewatan",
  "within 7 days of the delay": "dalam 7 hari selepas kelewatan",
  "Keep a daily site diary with photos of delays": "Simpan diari tapak harian dengan gambar kelewatan",
  "daily": "setiap hari",

  // lad
  "Delay penalties have no limit": "Penalti kelewatan tiada had",
  "Late completion costs RM 8,000 a day with no cap, plus you cover any penalties the employer charges them.": "Siap lewat dikenakan RM 8,000 sehari tanpa had, dan anda juga menanggung apa-apa penalti yang majikan kenakan ke atas mereka.",
  "Capped at 10% of the sum": "Dihadkan kepada 10% daripada jumlah kontrak",
  "RM 8,000 a day, no cap, plus their penalties": "RM 8,000 sehari, tanpa had, serta penalti mereka",
  "30 days late costs RM 240,000, close to your whole margin, and there's no ceiling.": "Lewat 30 hari merugikan RM 240,000, hampir keseluruhan margin anda, dan tiada had maksimum.",
  "30 days late at RM 8,000 a day": "Lewat 30 hari pada RM 8,000 sehari",
  "Cap all delay penalties, including the employer's, at 10% of the sum.": "Hadkan semua penalti kelewatan, termasuk penalti majikan, kepada 10% daripada jumlah kontrak.",
  "A 15% cap that includes the employer's penalties.": "Had 15% yang merangkumi penalti majikan.",
  "No cap at all.": "Tiada had langsung.",
  "We can accept LAD, but it must have a cap. Can we agree 10% of the subcontract sum, including any pass-through?": "Kami boleh terima LAD, tetapi ia mesti ada had. Boleh kita persetujui 10% daripada jumlah subkontrak, termasuk apa-apa penalti majikan?",

  // defects
  "24-month defects period": "Tempoh kecacatan 24 bulan",
  "Defects period of 24 months, counted from the Main Contract's completion.": "Tempoh kecacatan 24 bulan, dikira dari penyiapan Kontrak Utama.",
  "12–24 months": "12–24 bulan",
  "24 months from Main Contract completion": "24 bulan dari penyiapan Kontrak Utama",
  "Fix defects notified during the defects period": "Baiki kecacatan yang dimaklumkan dalam tempoh kecacatan",
  "until 24 months after Main Contract completion": "sehingga 24 bulan selepas Kontrak Utama siap",

  // bonds
  "5% bond, but it runs for years": "Bon 5%, tetapi tempohnya bertahun-tahun",
  "A 5% on-demand bank bond (RM 120,000), valid until 12 months after the Main Contract defects period.": "Bon bank on-demand 5% (RM 120,000), sah sehingga 12 bulan selepas tempoh kecacatan Kontrak Utama.",
  "5% bond": "Bon 5%",
  "5% on-demand bond, long expiry": "Bon on-demand 5%, tempoh sah yang panjang",
  "Get the bank performance bond issued": "Dapatkan bon pelaksanaan daripada bank",
  "within 14 days of the LOA": "dalam 14 hari dari tarikh LOA",

  // insurance
  "They insure the works; you pay the excess": "Mereka menginsuranskan kerja; anda membayar ekses",
  "Contoh Bina carries the works insurance, but you pay the RM 50,000 excess on claims caused by your work.": "Contoh Bina mengambil insurans kerja, tetapi anda membayar ekses RM 50,000 bagi tuntutan yang berpunca daripada kerja anda.",
  "Excess shared or passed to the party at fault": "Ekses dikongsi atau ditanggung oleh pihak yang bersalah",
  "You pay RM 50,000 per claim from your work": "Anda bayar RM 50,000 bagi setiap tuntutan daripada kerja anda",
  "Check your own insurance covers the excess, or set money aside": "Semak sama ada insurans anda sendiri melindungi ekses itu, atau sediakan peruntukan",

  // termination
  "They can end the job at 7 days' notice": "Mereka boleh menamatkan kerja dengan notis 7 hari",
  "Contoh Bina can end your subcontract at any time with 7 days' notice, paying only for work done.": "Contoh Bina boleh menamatkan subkontrak anda pada bila-bila masa dengan notis 7 hari, dan hanya membayar kerja yang sudah siap.",
  "Paid for demobilisation, materials and some profit": "Dibayar untuk demobilisasi, bahan dan sebahagian untung",
  "Paid only for work done": "Dibayar hanya untuk kerja yang siap",
  "You'd lose mobilisation costs, materials on order and your expected profit.": "Anda akan kehilangan kos mobilisasi, bahan yang telah dipesan dan untung yang dijangka.",
  "If ended for convenience: pay demobilisation, materials ordered and 10% of the unfinished value.": "Jika ditamatkan atas kehendak mereka: bayar demobilisasi, bahan yang dipesan dan 10% daripada nilai kerja yang belum siap.",
  "Demobilisation and materials ordered.": "Demobilisasi dan bahan yang telah dipesan.",
  "If you end the contract for convenience, we need our demobilisation and committed costs covered.": "Jika tuan menamatkan kontrak atas kehendak tuan, kami perlukan kos demobilisasi dan kos yang sudah kami komited ditanggung.",

  // suspension
  "You can't stop work even if unpaid": "Anda tidak boleh berhenti kerja walaupun tidak dibayar",
  "You may not stop or slow down for any reason, including not being paid.": "Anda tidak boleh berhenti atau memperlahankan kerja atas apa-apa sebab, termasuk tidak dibayar.",
  "Can suspend after notice of non-payment": "Boleh menggantung kerja selepas notis tidak dibayar",
  "No suspension allowed": "Penggantungan tidak dibenarkan",
  "Your main pressure when unpaid is removed. You'd keep spending money on a job that isn't paying you.": "Kuasa tawar-menawar utama anda apabila tidak dibayar dihapuskan. Anda akan terus berbelanja untuk kerja yang tidak membayar anda.",
  "Allow suspension after 14 days' written notice of non-payment.": "Benarkan penggantungan selepas notis bertulis 14 hari tentang bayaran yang tidak dibuat.",
  "Delete clause 19.1 and rely on your CIPAA rights.": "Buang klausa 19.1 dan bergantung pada hak CIPAA anda.",
  "We'll keep working in good faith, but we need the right to suspend if we're not paid after notice.": "Kami akan terus bekerja dengan niat baik, tetapi kami perlukan hak untuk menggantung kerja jika tidak dibayar selepas notis.",

  // disputes
  "Arbitration only after the whole project finishes, but payment disputes can go to CIPAA adjudication at any time.": "Timbang tara hanya selepas keseluruhan projek siap, tetapi pertikaian bayaran boleh dibawa ke adjudikasi CIPAA pada bila-bila masa.",
  "Adjudication available for payment disputes": "Adjudikasi tersedia untuk pertikaian bayaran",
  "Adjudication available; arbitration delayed": "Adjudikasi tersedia; timbang tara ditangguhkan",
  "For unpaid amounts, follow the CIPAA payment claim process": "Bagi jumlah yang belum dibayar, ikut proses tuntutan bayaran CIPAA",

  // ── Advisor replies
  "Start with payment. Ask Contoh Bina to delete the pay-when-paid proviso [F12] and move to 14-day certification and 30-day payment [F10] [F11]. That one change does more for your cash than everything else combined [PAY-1] [PAY-2].\n\nSecond, ask for a 10% advance against an advance payment bond [PAY-4].\n\nNext step: send these two asks in writing before the 3-day acceptance deadline [F36], and ask for 14 days to review the final conditions.":
    "Mulakan dengan bayaran. Minta Contoh Bina membuang syarat pay-when-paid [F12] dan menukar kepada perakuan 14 hari dan bayaran 30 hari [F10] [F11]. Satu perubahan ini lebih membantu tunai anda berbanding semua perkara lain digabungkan [PAY-1] [PAY-2].\n\nKedua, minta pendahuluan 10% dengan bon bayaran pendahuluan [PAY-4].\n\nLangkah seterusnya: hantar dua permintaan ini secara bertulis sebelum tarikh akhir penerimaan 3 hari [F36], dan minta 14 hari untuk menyemak syarat muktamad.",
  "On the current terms you claim monthly [F09], wait up to 21 days for certification [F10] and then 60 days for payment [F11]. With no advance [F08], the funding model shows you carrying over RM 2M at peak, against the RM 300k you have.\n\nIf payment also slips 30 days, the gap grows further. Pay-when-paid [F12] makes that slippage more likely.\n\nNext step: don't mobilise until payment terms or an advance are agreed.":
    "Dengan terma sekarang, anda menuntut setiap bulan [F09], menunggu sehingga 21 hari untuk perakuan [F10] dan kemudian 60 hari untuk bayaran [F11]. Tanpa pendahuluan [F08], model dana menunjukkan anda menanggung lebih RM 2J pada kemuncaknya, berbanding RM 300k yang anda ada.\n\nJika bayaran lewat 30 hari lagi, jurang itu bertambah besar. Pay-when-paid [F12] menjadikan kelewatan itu lebih berkemungkinan.\n\nLangkah seterusnya: jangan mobilisasi sehingga terma bayaran atau pendahuluan dipersetujui.",
  "LAD is RM 8,000 a day [F17] with no cap stated [G01], and you also indemnify Contoh Bina against the employer's LAD [F18]. A 4-week delay is RM 224,000 [TIM-2].\n\nWorse, you only get EOT if the employer grants it to Contoh Bina [F20], and late notice kills the claim [F19] [TIM-1].\n\nNext step: ask for EOT for any delay you didn't cause, and a combined LAD cap of 10% of the sum.":
    "LAD ialah RM 8,000 sehari [F17] tanpa had dinyatakan [G01], dan anda juga menanggung rugi Contoh Bina bagi LAD majikan [F18]. Kelewatan 4 minggu bersamaan RM 224,000 [TIM-2].\n\nLebih teruk, anda hanya dapat EOT jika majikan memberinya kepada Contoh Bina [F20], dan notis yang lewat menggugurkan tuntutan [F19] [TIM-1].\n\nLangkah seterusnya: minta EOT bagi apa-apa kelewatan yang bukan salah anda, dan had LAD gabungan 10% daripada jumlah kontrak.",
  "This is demo mode, so I answer from the sample analysis only. The short version: don't sign this week. Payment terms [PAY-1] [PAY-2], back-to-back EOT [TIM-1] and the contractor's power to resolve conflicts [DOC-2] all need to change first.\n\nConnect Bedrock (see BEDROCK_SETUP.md) to ask anything about your own documents.":
    "Ini mod demo, jadi saya hanya menjawab daripada analisis contoh. Ringkasnya: jangan tandatangan minggu ini. Terma bayaran [PAY-1] [PAY-2], EOT back-to-back [TIM-1] dan kuasa kontraktor untuk memutuskan percanggahan [DOC-2] semuanya perlu diubah dahulu.\n\nSambungkan Bedrock (lihat BEDROCK_SETUP.md) untuk bertanya apa sahaja tentang dokumen anda sendiri.",
};

// Demo-mode drafts for the sample deal, in Bahasa Malaysia.
export const DEMO_DRAFTS_MS: Record<DraftKind, string> = {
  notice_templates: `## 1. Notis kejadian kelewatan (lanjutan masa)

**Hantar dalam 7 hari selepas kejadian kelewatan (kl. 14.2).** Notis ialah syarat wajib: jika lewat, anda hilang hak lanjutan masa dan terdedah kepada LAD RM 8,000 sehari.

> Kepada: Contoh Bina Sdn Bhd — U/P: Pengurus Projek
> Tarikh: [tarikh]
> Ruj: Pakej P2 Bored Piling — Notis Kelewatan No. [__]
>
> Menurut Klausa 14.2 Syarat Subkontrak, kami memberi notis tentang kejadian kelewatan berikut:
>
> - **Kejadian:** [terangkan, cth. platform kerja belum siap di garisan grid A–D]
> - **Tarikh bermula:** [tarikh]
> - **Punca:** [punca, dan sebab ia bukan tanggungjawab kami]
> - **Kesan kepada kerja kami:** [aktiviti terjejas, anggaran kelewatan dalam hari]
>
> Kami akan memberi butiran lanjut apabila kesannya lebih jelas, dan kami mengekalkan hak kami untuk lanjutan masa serta menuntut kos yang berkaitan.
>
> [Nama, jawatan], bagi pihak Contoh Piling Sdn Bhd

## 2. Pengesahan perubahan kerja dan surat iringan tuntutan

**Hantar dalam 14 hari selepas arahan (kl. 9.3), jika tidak tuntutan dianggap dilepaskan.** Perubahan kerja hanya sah jika ditandatangani oleh Pengarah Contoh Bina (kl. 9.1), jadi sahkan dahulu apa-apa arahan tapak secara bertulis.

> Kepada: Contoh Bina Sdn Bhd — U/P: [Pengarah]
> Tarikh: [tarikh]
> Ruj: Pakej P2 — Tuntutan Perubahan Kerja No. [__]
>
> Kami merujuk arahan yang diberikan oleh [nama] pada [tarikh] untuk [terangkan kerja]. Di bawah Klausa 9.1, kami memohon pihak tuan mengesahkan arahan ini secara bertulis, ditandatangani oleh Pengarah.
>
> Di bawah Klausa 9.3, kami mengemukakan tuntutan bagi perubahan kerja ini:
>
> | Item | Keterangan | Kuantiti | Kadar (RM) | Jumlah (RM) |
> |---|---|---|---|---|
> | [ ] | [ ] | [ ] | [kadar BQ atau pecahan kadar] | [ ] |
>
> Rekod sokongan dilampirkan: [helaian daywork, gambar, rekod ukuran].
>
> [Nama, jawatan], bagi pihak Contoh Piling Sdn Bhd

## 3. Peringatan bayaran (sebelum tuntutan bayaran CIPAA)

**Hantar apabila bayaran tertunggak (60 hari selepas perakuan, kl. 12.3).** Jumlah diperakui yang lewat dibayar dikenakan faedah 5% setahun (kl. 23.1).

> Kami merujuk Perakuan Bayaran No. [__] bertarikh [tarikh] berjumlah RM [jumlah], yang perlu dibayar pada [tarikh] dan masih belum dijelaskan. Sila buat bayaran dalam 7 hari, bersama faedah 5% setahun di bawah Klausa 23.1. Bayaran tidak boleh bergantung pada bayaran oleh Majikan, kerana terma sedemikian tidak sah di bawah seksyen 35 CIPAA 2012. Jika bayaran tidak diterima, kami akan menyerahkan tuntutan bayaran di bawah CIPAA 2012.
`,

  financing_pack: `# Ringkasan pembiayaan modal kerja

**Pemohon:** Contoh Piling Sdn Bhd (subkontraktor cerucuk CIDB Gred G5, Selangor)
**Tujuan:** modal kerja untuk kerja bored piling Pakej P2

## Projek dan pakej
- **Projek:** Cadangan Pembangunan Residensi Contoh, Seksyen 13, Shah Alam (pembangunan kediaman swasta)
- **Majikan:** Contoh Development Sdn Bhd · **Kontraktor utama:** Contoh Bina Sdn Bhd
- **Pakej:** kerja bored piling dan empty bore, 16 minggu dari milikan tapak (dijangka 3 November 2026)

## Nilai kontrak dan terma bayaran
- **Jumlah subkontrak:** RM 2,400,000 (lump sum mengikut LOA; BQ diukur semula pada RM 2,361,600, sedang dijelaskan)
- **Tuntutan kemajuan:** bulanan, diperakui dalam 21 hari, dibayar 60 hari selepas perakuan
- **Wang tahanan:** 10% setiap bayaran, dihadkan kepada 5% (RM 120,000)
- **Bayaran pendahuluan:** tiada ditawarkan setakat ini (10% dimohon)

## Keperluan dana
- **Keperluan dana tertinggi:** kira-kira RM 2.2J sekitar minggu 15–16, sebelum bayaran kemajuan pertama diterima
- **Dana sendiri:** RM 300,000
- **Kekurangan:** kira-kira RM 1.9J mengikut terma kontrak; lebih tinggi jika bayaran lewat 30 hari
- **Tempoh keperluan:** sehingga bayaran kemajuan mengejar, sekitar minggu 24–28

## Risiko utama dan langkah yang sedang dirunding
- Bayaran bergantung pada majikan membayar kontraktor utama (tidak sah di bawah CIPAA s.35) → pembuangan dimohon
- Tempoh bayaran 60 hari → 30 hari dimohon; pendahuluan 10% dimohon
- LAD RM 8,000/hari tanpa had → had 10% dimohon
- Risiko keadaan tanah → kadar halangan dimohon; laporan penyiasatan tanah dimohon

## Cagaran yang boleh ditawarkan
- Penyerahan hak bayaran kemajuan di bawah subkontrak, tertakluk kepada persetujuan kontraktor utama
- [Simpanan tetap sedia ada / jaminan pengarah — akan disahkan]

*Angka diambil daripada analisis DealGuard ke atas dokumen draf dan akan berubah apabila terma dipersetujui.*
`,
};
