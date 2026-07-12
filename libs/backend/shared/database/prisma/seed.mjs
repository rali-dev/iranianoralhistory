import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function ensureDoc(videoId, title, s3Key) {
  const exists = await prisma.document.findFirst({ where: { videoId, s3Key } });
  if (!exists) {
    await prisma.document.create({ data: { title, s3Key, videoId } });
  }
}

async function main() {
  const v1 = await prisma.video.upsert({
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

  const v2 = await prisma.video.upsert({
    where: { vimeoId: '148751763' },
    update: {},
    create: {
      vimeoId: '148751763',
      titleDe: 'Erinnerungen an Teheran – Nasrin Hosseini',
      titleEn: 'Memories of Tehran – Nasrin Hosseini',
      titleFa: 'خاطرات تهران – نسرین حسینی',
      descDe: 'Persönliche Erinnerungen an das Teheran der 1960er Jahre.',
      descEn: 'Personal memories of Tehran in the 1960s.',
      descFa: 'خاطرات شخصی از تهران در دهه ۱۳۴۰.',
    },
  });

  const v3 = await prisma.video.upsert({
    where: { vimeoId: '22439234' },
    update: {},
    create: {
      vimeoId: '22439234',
      titleDe: 'Die Kunst des Exils – Hamid Rahmani',
      titleEn: 'The Art of Exile – Hamid Rahmani',
      titleFa: 'هنر تبعید – حمید رحمانی',
      descDe: 'Über Kunst, Identität und das Leben zwischen zwei Kulturen.',
      descEn: 'About art, identity and life between two cultures.',
      descFa: 'درباره هنر، هویت و زندگی میان دو فرهنگ.',
    },
  });

  const v4 = await prisma.video.upsert({
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

  const v5 = await prisma.video.upsert({
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

  // ── Documents (min. 3 per video, idempotent) ─────────────────────────────────
  await ensureDoc(v1.id, 'Transkript (DE)',            'transcripts/ahmadi-de.pdf');
  await ensureDoc(v1.id, 'Transcript (EN)',            'transcripts/ahmadi-en.pdf');
  await ensureDoc(v1.id, 'Biografische Kurznotiz',    'docs/ahmadi-bio.pdf');
  await ensureDoc(v1.id, 'Quellenverzeichnis',        'docs/ahmadi-quellen.pdf');

  await ensureDoc(v2.id, 'Begleitdokument',           'docs/hosseini-background.pdf');
  await ensureDoc(v2.id, 'Biografische Notizen',      'docs/hosseini-bio.pdf');
  await ensureDoc(v2.id, 'Fotodokumentation Teheran', 'docs/hosseini-fotos.pdf');

  await ensureDoc(v3.id, 'Ausstellungskatalog',       'docs/rahmani-catalog.pdf');
  await ensureDoc(v3.id, 'Werkverzeichnis',           'docs/rahmani-werke.pdf');
  await ensureDoc(v3.id, 'Künstlerbiografie',         'docs/rahmani-bio.pdf');

  await ensureDoc(v4.id, 'Historische Zeitleiste 1979',  'docs/revolution-timeline.pdf');
  await ensureDoc(v4.id, 'Zeitzeugenberichte (Auswahl)', 'docs/revolution-berichte.pdf');
  await ensureDoc(v4.id, 'Exilgemeinden in Europa',      'docs/exil-europa.pdf');

  await ensureDoc(v5.id, 'Begleitdokument',           'docs/musik-widerstand.pdf');
  await ensureDoc(v5.id, 'Konzertprogramm 1994',      'docs/konzert-1994.pdf');
  await ensureDoc(v5.id, 'Musikarchiv RAIOH',         'docs/musikarchiv-raioh.pdf');

  console.log('✅ Seed abgeschlossen:');
  console.log(' -', v1.titleDe);
  console.log(' -', v2.titleDe);
  console.log(' -', v3.titleDe);
  console.log(' -', v4.titleDe);
  console.log(' -', v5.titleDe);
  console.log('   Dokumente: min. 3 pro Video sichergestellt ✓');
}

main()
  .catch((e) => { console.error('❌ Fehler:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
