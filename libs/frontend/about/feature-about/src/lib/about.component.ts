import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import { ImageLightboxService } from '@iranianoralhistory/frontend-shared-ui';
import { ARCHIVE_INDEX_INTRO, ARCHIVE_INDEX_SECTIONS } from './archive-index.data';

export type AboutSection =
  | 'overview'
  | 'history'
  | 'genesis'
  | 'method'
  | 'videos'
  | 'subjects'
  | 'documents'
  | 'team'
  | 'finance'
  | 'testimonials'
  | 'contact';

interface SectionMeta {
  key: AboutSection;
  navKey: string;
  /** When true, the entry is only shown in the Persian (RTL) translation. */
  rtlOnly?: boolean;
}

@Component({
  selector: 'lib-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  readonly i18n          = inject(I18nService);
  readonly lightbox      = inject(ImageLightboxService);
  readonly activeSection = signal<AboutSection>('overview');
  readonly menuOpen      = signal(false);

  /** Expansion state of the archive parties/organizations index (Persian only). */
  readonly partiesIndexOpen = signal(false);

  readonly sections: SectionMeta[] = [
    { key: 'overview',     navKey: 'ABOUT.NAV.OVERVIEW' },
    { key: 'history',      navKey: 'ABOUT.NAV.HISTORY' },
    { key: 'genesis',      navKey: 'ABOUT.NAV.GENESIS', rtlOnly: true },
    { key: 'method',       navKey: 'ABOUT.NAV.METHOD' },
    { key: 'videos',       navKey: 'ABOUT.NAV.VIDEOS' },
    { key: 'subjects',     navKey: 'ABOUT.NAV.SUBJECTS' },
    { key: 'documents',    navKey: 'ABOUT.NAV.DOCUMENTS' },
    { key: 'team',         navKey: 'ABOUT.NAV.TEAM' },
    { key: 'finance',      navKey: 'ABOUT.NAV.FINANCE', rtlOnly: true },
    { key: 'testimonials', navKey: 'ABOUT.NAV.TESTIMONIALS' },
    { key: 'contact',      navKey: 'ABOUT.NAV.CONTACT' },
  ];

  /** Menu entries available for the active language (RTL-only items hidden outside Persian). */
  readonly visibleSections = computed(() =>
    this.sections.filter(s => !s.rtlOnly || this.i18n.isRtl()),
  );

  /** Persian-only archive index rendered inside the expandable inventory panel. */
  readonly archiveIndexIntro    = ARCHIVE_INDEX_INTRO;
  readonly archiveIndexSections = ARCHIVE_INDEX_SECTIONS;

  /** Academic testimonials — quote plus optional attribution lines (texts live in i18n). */
  readonly testimonials = [
    { textKey: 'ABOUT.TESTIMONIALS.Q1_TEXT', authorKey: 'ABOUT.TESTIMONIALS.Q1_AUTHOR', roleKey: 'ABOUT.TESTIMONIALS.Q1_ROLE', orgKey: 'ABOUT.TESTIMONIALS.Q1_ORG', dateKey: 'ABOUT.TESTIMONIALS.Q1_DATE', sourceKey: 'ABOUT.TESTIMONIALS.Q1_SOURCE' },
    { textKey: 'ABOUT.TESTIMONIALS.Q2_TEXT', authorKey: 'ABOUT.TESTIMONIALS.Q2_AUTHOR', roleKey: 'ABOUT.TESTIMONIALS.Q2_ROLE', orgKey: 'ABOUT.TESTIMONIALS.Q2_ORG', dateKey: 'ABOUT.TESTIMONIALS.Q2_DATE', sourceKey: 'ABOUT.TESTIMONIALS.Q2_SOURCE' },
    { textKey: 'ABOUT.TESTIMONIALS.Q3_TEXT', authorKey: 'ABOUT.TESTIMONIALS.Q3_AUTHOR', roleKey: 'ABOUT.TESTIMONIALS.Q3_ROLE', orgKey: 'ABOUT.TESTIMONIALS.Q3_ORG', dateKey: 'ABOUT.TESTIMONIALS.Q3_DATE', sourceKey: 'ABOUT.TESTIMONIALS.Q3_SOURCE' },
    { textKey: 'ABOUT.TESTIMONIALS.Q4_TEXT', authorKey: 'ABOUT.TESTIMONIALS.Q4_AUTHOR', roleKey: 'ABOUT.TESTIMONIALS.Q4_ROLE', orgKey: 'ABOUT.TESTIMONIALS.Q4_ORG', dateKey: 'ABOUT.TESTIMONIALS.Q4_DATE', sourceKey: 'ABOUT.TESTIMONIALS.Q4_SOURCE' },
    { textKey: 'ABOUT.TESTIMONIALS.Q5_TEXT', authorKey: 'ABOUT.TESTIMONIALS.Q5_AUTHOR', roleKey: 'ABOUT.TESTIMONIALS.Q5_ROLE', orgKey: 'ABOUT.TESTIMONIALS.Q5_ORG', dateKey: 'ABOUT.TESTIMONIALS.Q5_DATE', sourceKey: 'ABOUT.TESTIMONIALS.Q5_SOURCE' },
    { textKey: 'ABOUT.TESTIMONIALS.Q6_TEXT', authorKey: 'ABOUT.TESTIMONIALS.Q6_AUTHOR', roleKey: 'ABOUT.TESTIMONIALS.Q6_ROLE', orgKey: 'ABOUT.TESTIMONIALS.Q6_ORG', dateKey: 'ABOUT.TESTIMONIALS.Q6_DATE', sourceKey: 'ABOUT.TESTIMONIALS.Q6_SOURCE' },
  ] as const;

  /** Team roster — role/name pairs rendered in reading order (texts live in i18n). */
  readonly teamMembers = [
    { roleKey: 'ABOUT.TEAM.FOUNDER_ROLE',     nameKey: 'ABOUT.TEAM.FOUNDER_NAME' },
    { roleKey: 'ABOUT.TEAM.DEPUTY_ROLE',      nameKey: 'ABOUT.TEAM.DEPUTY_NAME' },
    { roleKey: 'ABOUT.TEAM.FILMMAKER_ROLE',   nameKey: 'ABOUT.TEAM.FILMMAKER_NAME' },
    { roleKey: 'ABOUT.TEAM.CTO_ROLE',         nameKey: 'ABOUT.TEAM.CTO_NAME' },
    { roleKey: 'ABOUT.TEAM.ADVISOR_ROLE',     nameKey: 'ABOUT.TEAM.ADVISOR_NAME' },
    { roleKey: 'ABOUT.TEAM.SUPPORT_ROLE',     nameKey: 'ABOUT.TEAM.SUPPORT_NAME' },
    { roleKey: 'ABOUT.TEAM.TRANSLATION_ROLE', nameKey: 'ABOUT.TEAM.TRANSLATION_NAME' },
  ] as const;

  /** Inventory entries of the “آرشیو اسناد و نشریات” list that open a PDF (Persian only). */
  readonly archivePdfLinks = [
    { labelKey: 'ABOUT.DOCUMENTS.LIST_2', file: 'asnad.pdf' },
    { labelKey: 'ABOUT.DOCUMENTS.LIST_3', file: 'asnad-tarikh-be-eng.pdf' },
    { labelKey: 'ABOUT.DOCUMENTS.LIST_5', file: 'jonbesh-e-chap.pdf' },
    { labelKey: 'ABOUT.DOCUMENTS.LIST_6', file: 'jonbesh-islamgarayee-dar-iran.pdf' },
  ] as const;

  private readonly faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  constructor() {
    // If the language is switched away from Persian while a Persian-only
    // section is open, fall back to the overview so the content never blanks out.
    effect(() => {
      const visible = this.visibleSections();
      if (!visible.some(s => s.key === this.activeSection())) {
        this.activeSection.set('overview');
      }
    });
  }

  setSection(section: AboutSection): void {
    this.activeSection.set(section);
    this.menuOpen.set(false);
    this.partiesIndexOpen.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  togglePartiesIndex(): void {
    this.partiesIndexOpen.update(v => !v);
  }

  /** Formats a Latin integer as a Persian-digit string (e.g. 12 → ۱۲). */
  toFa(n: number): string {
    return String(n).replace(/\d/g, d => this.faDigits[+d]);
  }

  /** Opens an About PDF from the shared assets folder in a new tab. */
  openAboutPdf(file: string): void {
    window.open(`assets/about/${file}`, '_blank', 'noopener,noreferrer');
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  openGhaniImage(): void {
    this.lightbox.open(
      'assets/about/ghani-Hamid.jpg',
      'غنی بلوریان و حمید احمدی — پراگ، آخر بهار ۱۹۸۶',
    );
  }

  openConferencePdf(): void {
    window.open('assets/about/Internat-Oral-History-Conference-9.pdf', '_blank', 'noopener,noreferrer');
  }

  openAsnadPdf(): void {
    window.open('assets/about/asnad.pdf', '_blank', 'noopener,noreferrer');
  }

  openAgreementPdf(): void {
    window.open('assets/about/agreement.pdf', '_blank', 'noopener,noreferrer');
  }

  openTawafoghPdf(): void {
    window.open('assets/about/tawafognameh.pdf', '_blank', 'noopener,noreferrer');
  }

  openAlaviCoverGif(): void {
    window.open('assets/about/alavi1.gif', '_blank', 'noopener,noreferrer');
  }
}
