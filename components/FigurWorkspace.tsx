import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AccountButton from './AccountButton';
import HelpButton from './HelpButton';
import FakeSigninButton from '../FakeSignin/Button';
import { ProjectsDialog } from './ProjectsDialog';
import { FigurHeader } from './editor/FigurHeader';
import { FigurSidebar } from './editor/FigurSidebar';
import { FigurStage } from './editor/FigurStage';

export function FigurWorkspace({ projectOpen = false }: { projectOpen?: boolean }) {
  const [projectsOpen, setProjectsOpen] = useState(!projectOpen);
  const [headerActions, setHeaderActions] = useState<HTMLElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const onOpenProjects = useCallback(() => setProjectsOpen(true), []);
  const onCloseProjects = useCallback(() => setProjectsOpen(false), []);
  const onCloseSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    const closeForWalkthrough = () => {
      setProjectsOpen(false);
      setSidebarOpen(false);
    };
    window.addEventListener('patchman:walkthrough-start', closeForWalkthrough);
    return () => window.removeEventListener('patchman:walkthrough-start', closeForWalkthrough);
  }, []);

  useEffect(() => {
    const reopenProjects = () => {
      if (!projectOpen) {
        setProjectsOpen(true);
      }
    };
    window.addEventListener('patchman:walkthrough-end', reopenProjects);
    return () => window.removeEventListener('patchman:walkthrough-end', reopenProjects);
  }, [projectOpen]);

  useEffect(() => {
    void import('../src/main');

    const actions = document.getElementById('figur-header-actions');
    const menuToggle = document.getElementById('figur-menu-toggle');
    const backdrop = document.getElementById('figur-sidebar-backdrop');
    const statusPill = document.getElementById('figur-status-pill');
    const projectsButton = document.getElementById('figur-open-projects');
    const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-figur-tab]'));
    const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-figur-panel]'));

    const toggleSidebar = () => setSidebarOpen((current) => !current);
    const choosePhoto = () => document.getElementById('file-input')?.click();
    const selectTab = (event: Event) => {
      const selected = (event.currentTarget as HTMLButtonElement).dataset.figurTab;
      tabs.forEach((tab) => {
        const active = tab.dataset.figurTab === selected;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-pressed', String(active));
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.figurPanel !== selected;
      });
    };

    setHeaderActions(actions);
    menuToggle?.addEventListener('click', toggleSidebar);
    backdrop?.addEventListener('click', onCloseSidebar);
    statusPill?.addEventListener('click', choosePhoto);
    projectsButton?.addEventListener('click', onOpenProjects);
    tabs.forEach((tab) => tab.addEventListener('click', selectTab));

    return () => {
      menuToggle?.removeEventListener('click', toggleSidebar);
      backdrop?.removeEventListener('click', onCloseSidebar);
      statusPill?.removeEventListener('click', choosePhoto);
      projectsButton?.removeEventListener('click', onOpenProjects);
      tabs.forEach((tab) => tab.removeEventListener('click', selectTab));
    };
  }, [onCloseSidebar, onOpenProjects]);

  useEffect(() => {
    const panel = document.getElementById('panel');
    const backdrop = document.getElementById('figur-sidebar-backdrop');
    const toggle = document.getElementById('figur-menu-toggle');
    panel?.classList.toggle('mobile-open', sidebarOpen);
    backdrop?.classList.toggle('active', sidebarOpen);
    toggle?.setAttribute('aria-expanded', String(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <>
      <Head>
        <title>FIGUR | Photo Body Editor by Patchman</title>
        <meta name="description" content="Shape and refine portraits with private browser-based controls." />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <div id="app">
        <FigurHeader />

        <button
          id="figur-sidebar-backdrop"
          className="figur-sidebar-backdrop"
          type="button"
          aria-label="Close editing controls"
        />

        <FigurStage />

        <FigurSidebar />
      </div>

      {headerActions
        ? createPortal(
            <div className="shared-actions">
              <button className="shared-projects" type="button" onClick={onOpenProjects}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M3 5h7l2 2h9v12H3V5m2 4v8h14V9H5Z" />
                </svg>
                <span>PROJECTS</span>
              </button>
              <HelpButton />
              <AccountButton />
            </div>,
            headerActions,
          )
        : null}

      <FakeSigninButton />

      <ProjectsDialog open={projectsOpen} onClose={onCloseProjects} />
    </>
  );
}
