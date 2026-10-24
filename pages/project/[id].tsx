import CreditBalance from '../../components/CreditBalance';
import AdsButton from '../../components/AdsButton';
import Head from 'next/head';
import { useFigurWorkspace } from '../../lib/useFigurWorkspace';
import { projectStore } from '../../lib/project-store';
import { createPortal } from 'react-dom';
import AccountButton from '../../components/AccountButton';
import HelpButton from '../../components/HelpButton';
import { ProjectsDialog } from '../../components/ProjectsDialog';
import { FigurHeader } from '../../components/editor/FigurHeader';
import { FigurSidebar } from '../../components/editor/FigurSidebar';
import { FigurStage } from '../../components/editor/FigurStage';

export default function FigurProjectPage() {
  const { editorReady, headerActions, onCloseProjects, onOpenProjects, projectsOpen, state } = useFigurWorkspace(true);

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
        <div className="project-save-state" role="status">
          {!editorReady
            ? 'OPENING PROJECT'
            : state.isSaving
              ? 'SAVING PROJECT'
              : state.dirty
                ? 'UNSAVED EDITS'
                : state.project
                  ? 'PROJECT SAVED'
                  : 'CHOOSE A PROJECT'}
        </div>
        {state.error && (
          <div className="project-save-error" role="alert">
            <p>{state.error}</p>
            <button type="button" onClick={projectStore.retry}>
              RETRY SAVE
            </button>
            <button type="button" onClick={projectStore.clearError} aria-label="Dismiss project error">
              CLOSE
            </button>
          </div>
        )}

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
              <CreditBalance />
              <AdsButton />
              <HelpButton />
              <AccountButton />
            </div>,
            headerActions,
          )
        : null}

      <ProjectsDialog open={projectsOpen} onClose={onCloseProjects} />
    </>
  );
}
