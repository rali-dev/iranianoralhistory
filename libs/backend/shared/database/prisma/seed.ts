import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] ?? '' });
const prisma = new PrismaClient({ adapter });

async function ensureDoc(videoId: string, title: string, storagePath: string): Promise<void> {
  const exists = await prisma.document.findFirst({ where: { videoId, storagePath } });
  if (!exists) {
    await prisma.document.create({ data: { title, storagePath, videoId } });
  }
}

async function main() {
  // ── Videos ──────────────────────────────────────────────────────────────────
  const video1 = await prisma.video.upsert({
    where: { vimeoId: '76979871' },
    update: {},
    create: {
      vimeoId: '76979871',
      titleDe: 'Zeitzeugen des Wandels – Interview mit Dr. Ahmadi',
      titleEn: 'Witnesses of Change – Interview with Dr. Ahmadi',
      titleFa: 'شاهدان تحول – مصاحبه با دکتر احمدی',
      descDe: 'Ein bewegendes Interview über die iranische Geschichte des 20. Jahrhunderts.',
      descEn: 'A moving interview about 20th century Iranian history.',
      descFa: 'مصاحبه‌ای تأثیرگذار درباره تاریخ ایران در قرن بیستم.',
    },
  });

  const video2 = await prisma.video.upsert({
    where: { vimeoId: '148751763' },
    update: {},
    create: {
      vimeoId: '148751763',
      titleDe: 'Erinnerungen an Teheran – Gespräch mit Nasrin Hosseini',
      titleEn: 'Memories of Tehran – Conversation with Nasrin Hosseini',
      titleFa: 'خاطرات تهران – گفتگو با نسرین حسینی',
      descDe: 'Persönliche Erinnerungen an das Teheran der 1960er Jahre.',
      descEn: 'Personal memories of Tehran in the 1960s.',
      descFa: 'خاطرات شخصی از تهران در دهه ۱۳۴۰.',
    },
  });

  const video3 = await prisma.video.upsert({
    where: { vimeoId: '22439234' },
    update: {},
    create: {
      vimeoId: '22439234',
      titleDe: 'Die Kunst des Exils – Hamid Rahmani im Gespräch',
      titleEn: 'The Art of Exile – Hamid Rahmani in Conversation',
      titleFa: 'هنر تبعید – گفتگو با حمید رحمانی',
      descDe: 'Über Kunst, Identität und das Leben zwischen zwei Kulturen.',
      descEn: 'About art, identity and life between two cultures.',
      descFa: 'درباره هنر، هویت و زندگی میان دو فرهنگ.',
    },
  });

  const video4 = await prisma.video.upsert({
    where: { vimeoId: '253989945' },
    update: {},
    create: {
      vimeoId: '253989945',
      titleDe: 'Revolution und Exil – Das Leben nach 1979',
      titleEn: 'Revolution and Exile – Life after 1979',
      titleFa: 'انقلاب و تبعید – زندگی پس از ۱۳۵۷',
      descDe: 'Persönliche Berichte von Zeitzeugen über das Leben nach der Islamischen Revolution.',
      descEn: 'Personal accounts from witnesses about life after the Islamic Revolution.',
      descFa: 'روایت‌های شخصی از شاهدان درباره زندگی پس از انقلاب اسلامی.',
    },
  });

  const video5 = await prisma.video.upsert({
    where: { vimeoId: '312342500' },
    update: {},
    create: {
      vimeoId: '312342500',
      titleDe: 'Musik und Widerstand – Iranische Kunst im Exil',
      titleEn: 'Music and Resistance – Iranian Art in Exile',
      titleFa: 'موسیقی و مقاومت – هنر ایرانی در تبعید',
      descDe: 'Über die Bewahrung kultureller Identität durch Musik und Kunst im Exil.',
      descEn: 'On preserving cultural identity through music and art in exile.',
      descFa: 'درباره حفظ هویت فرهنگی از طریق موسیقی و هنر در تبعید.',
    },
  });

  // ── Documents ─────────────────────────────────────────────────────────────────
  // storagePath = bucket-relative path within the "documents" bucket.
  // Signed URLs are generated at runtime by SupabaseStorageService.

  // video1 – Ahmadi
  await ensureDoc(video1.id, 'Transkript (DE)',            'transcripts/ahmadi-de.pdf');
  await ensureDoc(video1.id, 'Transcript (EN)',            'transcripts/ahmadi-en.pdf');
  await ensureDoc(video1.id, 'Biografische Kurznotiz',    'docs/ahmadi-bio.pdf');
  await ensureDoc(video1.id, 'Quellenverzeichnis',        'docs/ahmadi-quellen.pdf');

  // video2 – Hosseini
  await ensureDoc(video2.id, 'Begleitdokument',           'docs/hosseini-background.pdf');
  await ensureDoc(video2.id, 'Biografische Notizen',      'docs/hosseini-bio.pdf');
  await ensureDoc(video2.id, 'Fotodokumentation Teheran', 'docs/hosseini-fotos.pdf');

  // video3 – Rahmani
  await ensureDoc(video3.id, 'Ausstellungskatalog',       'docs/rahmani-catalog.pdf');
  await ensureDoc(video3.id, 'Werkverzeichnis',           'docs/rahmani-werke.pdf');
  await ensureDoc(video3.id, 'Künstlerbiografie',         'docs/rahmani-bio.pdf');

  // video4 – Revolution und Exil
  await ensureDoc(video4.id, 'Historische Zeitleiste 1979',  'docs/revolution-timeline.pdf');
  await ensureDoc(video4.id, 'Zeitzeugenberichte (Auswahl)', 'docs/revolution-berichte.pdf');
  await ensureDoc(video4.id, 'Exilgemeinden in Europa',      'docs/exil-europa.pdf');

  // video5 – Musik und Widerstand
  await ensureDoc(video5.id, 'Begleitdokument',           'docs/musik-widerstand.pdf');
  await ensureDoc(video5.id, 'Konzertprogramm 1994',      'docs/konzert-1994.pdf');
  await ensureDoc(video5.id, 'Musikarchiv RAIOH',         'docs/musikarchiv-raioh.pdf');

  // ── Collections (type = PERSON) ──────────────────────────────────────────────
  const colAhmadi = await prisma.collection.upsert({
    where: { slug: 'hamid-ahmadi' },
    update: {},
    create: {
      slug: 'hamid-ahmadi',
      type: 'PERSON',
      nameDe: 'Hamid Ahmadi',
      nameEn: 'Hamid Ahmadi',
      nameFa: 'حمید احمدی',
      descDe: 'Iranischer Historiker und Gründer des Forschungsvereins für Iranische Oral History (RAIOH). Dokumentiert seit 1985 Lebensgeschichten iranischer Zeitzeugen.',
      descEn: 'Iranian historian and founder of the Research Association for Iranian Oral History (RAIOH). Documents life stories of Iranian witnesses since 1985.',
      descFa: 'مورخ ایرانی و بنیانگذار انجمن پژوهشی تاریخ شفاهی ایران. از سال ۱۹۸۵ داستان‌های زندگی شاهدان ایرانی را مستند می‌کند.',
      sortOrder: 1,
    },
  });

  const colHosseini = await prisma.collection.upsert({
    where: { slug: 'nasrin-hosseini' },
    update: {},
    create: {
      slug: 'nasrin-hosseini',
      type: 'PERSON',
      nameDe: 'Nasrin Hosseini',
      nameEn: 'Nasrin Hosseini',
      nameFa: 'نسرین حسینی',
      descDe: 'Zeitzeugin der iranischen Gesellschaft der 1960er und 1970er Jahre. Ihre Berichte dokumentieren das städtische Leben in Teheran vor der Revolution.',
      descEn: 'Witness of Iranian society in the 1960s and 1970s. Her accounts document urban life in Tehran before the revolution.',
      descFa: 'شاهد جامعه ایرانی در دهه‌های ۱۳۴۰ و ۱۳۵۰. روایت‌های او زندگی شهری در تهران پیش از انقلاب را مستند می‌کند.',
      sortOrder: 2,
    },
  });

  const colRahmani = await prisma.collection.upsert({
    where: { slug: 'hamid-rahmani' },
    update: {},
    create: {
      slug: 'hamid-rahmani',
      type: 'PERSON',
      nameDe: 'Hamid Rahmani',
      nameEn: 'Hamid Rahmani',
      nameFa: 'حمید رحمانی',
      descDe: 'Iranischer Künstler im Exil. Seine Werke reflektieren Identität, Heimatverlust und kulturelle Bewahrung zwischen zwei Welten.',
      descEn: 'Iranian artist in exile. His works reflect identity, loss of home and cultural preservation between two worlds.',
      descFa: 'هنرمند ایرانی در تبعید. آثار او هویت، از دست دادن وطن و حفظ فرهنگ میان دو جهان را بازتاب می‌دهد.',
      sortOrder: 3,
    },
  });

  // ── Categories (type = TOPIC) ────────────────────────────────────────────────
  const catRevolution = await prisma.collection.upsert({
    where: { slug: 'islamische-revolution' },
    update: {},
    create: {
      slug: 'islamische-revolution',
      type: 'TOPIC',
      nameDe: 'Islamische Revolution 1979',
      nameEn: 'Islamic Revolution 1979',
      nameFa: 'انقلاب اسلامی ۱۳۵۷',
      descDe: 'Zeitzeugenberichte und persönliche Erlebnisse rund um die Islamische Revolution und ihre unmittelbaren Folgen für die iranische Gesellschaft.',
      descEn: 'Eyewitness accounts and personal experiences surrounding the Islamic Revolution and its immediate impact on Iranian society.',
      descFa: 'روایت‌های شاهدان عینی و تجربیات شخصی پیرامون انقلاب اسلامی و تأثیر فوری آن بر جامعه ایران.',
      sortOrder: 1,
    },
  });

  const catExil = await prisma.collection.upsert({
    where: { slug: 'exil-diaspora' },
    update: {},
    create: {
      slug: 'exil-diaspora',
      type: 'TOPIC',
      nameDe: 'Exil und Diaspora',
      nameEn: 'Exile and Diaspora',
      nameFa: 'تبعید و دیاسپورا',
      descDe: 'Erfahrungen iranischer Exilanten in Europa und weltweit. Identität, Integration und die Bewahrung kultureller Wurzeln in der Diaspora.',
      descEn: 'Experiences of Iranian exiles in Europe and worldwide. Identity, integration and the preservation of cultural roots in the diaspora.',
      descFa: 'تجربیات تبعیدیان ایرانی در اروپا و سراسر جهان. هویت، ادغام و حفظ ریشه‌های فرهنگی در دیاسپورا.',
      sortOrder: 2,
    },
  });

  const catKunst = await prisma.collection.upsert({
    where: { slug: 'kunst-kultur-widerstand' },
    update: {},
    create: {
      slug: 'kunst-kultur-widerstand',
      type: 'TOPIC',
      nameDe: 'Kunst, Kultur und Widerstand',
      nameEn: 'Art, Culture and Resistance',
      nameFa: 'هنر، فرهنگ و مقاومت',
      descDe: 'Wie Kunst, Musik und Literatur als Formen des kulturellen Widerstands und der Identitätswahrung im iranischen Exil wirkten.',
      descEn: 'How art, music and literature served as forms of cultural resistance and identity preservation in the Iranian exile.',
      descFa: 'چگونه هنر، موسیقی و ادبیات به عنوان اشکال مقاومت فرهنگی و حفظ هویت در تبعید ایرانی عمل کردند.',
      sortOrder: 3,
    },
  });

  // ── VideoCollection links ────────────────────────────────────────────────────
  // PERSON collections ↔ their primary subject's video
  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video1.id, collectionId: colAhmadi.id } },
    update: {},
    create: { videoId: video1.id, collectionId: colAhmadi.id },
  });

  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video2.id, collectionId: colHosseini.id } },
    update: {},
    create: { videoId: video2.id, collectionId: colHosseini.id },
  });

  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video3.id, collectionId: colRahmani.id } },
    update: {},
    create: { videoId: video3.id, collectionId: colRahmani.id },
  });

  // TOPIC category: Islamische Revolution → videos 4 + 1 (Ahmadi discusses revolution)
  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video4.id, collectionId: catRevolution.id } },
    update: {},
    create: { videoId: video4.id, collectionId: catRevolution.id },
  });
  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video1.id, collectionId: catRevolution.id } },
    update: {},
    create: { videoId: video1.id, collectionId: catRevolution.id },
  });

  // TOPIC category: Exil und Diaspora → videos 3 + 4 + 5
  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video3.id, collectionId: catExil.id } },
    update: {},
    create: { videoId: video3.id, collectionId: catExil.id },
  });
  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video4.id, collectionId: catExil.id } },
    update: {},
    create: { videoId: video4.id, collectionId: catExil.id },
  });
  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video5.id, collectionId: catExil.id } },
    update: {},
    create: { videoId: video5.id, collectionId: catExil.id },
  });

  // TOPIC category: Kunst & Widerstand → videos 3 + 5
  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video3.id, collectionId: catKunst.id } },
    update: {},
    create: { videoId: video3.id, collectionId: catKunst.id },
  });
  await prisma.videoCollection.upsert({
    where: { videoId_collectionId: { videoId: video5.id, collectionId: catKunst.id } },
    update: {},
    create: { videoId: video5.id, collectionId: catKunst.id },
  });

  console.log('✅ Seed abgeschlossen:');
  console.log('   Videos:      ', { v1: video1.id, v2: video2.id, v3: video3.id, v4: video4.id, v5: video5.id });
  console.log('   Sammlungen:  ', { ahmadi: colAhmadi.id, hosseini: colHosseini.id, rahmani: colRahmani.id });
  console.log('   Kategorien:  ', { revolution: catRevolution.id, exil: catExil.id, kunst: catKunst.id });
  console.log('   Dokumente:   min. 3 pro Video sichergestellt ✓');
}

main()
  .catch((e) => {
    console.error('❌ Seed fehlgeschlagen:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
