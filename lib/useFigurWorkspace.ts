import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/router';
import { accountSDK } from './account/sdk';
import { projectStore } from './project-store';
import type { FigurRuntime } from '../src/main';

export function useFigurWorkspace(projectOpen: boolean) {
  const [projectsOpen, setProjectsOpen] = useState(!projectOpen);
  const [headerActions, setHeaderActions] = useState<HTMLElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const state = useSyncExternalStore(projectStore.subscribe, projectStore.getSnapshot, projectStore.getServerSnapshot);
  const router = useRouter();
  const id = projectOpen && typeof router.query.id === 'string' ? router.query.id : undefined;
  const onOpenProjects = useCallback(() => setProjectsOpen(true), []);
  const onCloseProjects = useCallback(() => setProjectsOpen(false), []);
  const onCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    let disposed = false;
    let ready = false;
    let runtime: FigurRuntime | undefined;
    const controller = new AbortController();
    const signal = controller.signal;
    const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-figur-tab]'));
    const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-figur-panel]'));
    const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
    const stage = document.getElementById('stage');
    const controls = document.querySelector<HTMLElement>('.panel-scroll');
    const setReady = (value: boolean) => {
      ready = value;
      setEditorReady(value);
      if (fileInput) {
        fileInput.disabled = !value;
      }
      if (stage) {
        stage.inert = !value;
        stage.setAttribute('aria-busy', String(!value));
      }
      if (controls) {
        controls.inert = !value;
      }
    };
    setReady(false);
    const select = (tool: string) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.figurTab === tool;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-pressed', String(active));
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.figurPanel !== tool;
      });
    };
    const closeOverlays = () => {
      setProjectsOpen(false);
      setSidebarOpen(false);
    };
    const reopen = () => {
      if (!id && !accountSDK()?.getActiveModal()) {
        setProjectsOpen(true);
      }
    };
    const choosePhoto = (event?: Event) => {
      if (!ready || !projectStore.getSnapshot().project) {
        event?.preventDefault();
        event?.stopImmediatePropagation();
        if (ready) {
          setProjectsOpen(true);
        }
      }
    };
    document.getElementById('stage')?.addEventListener('drop', choosePhoto, { capture: true, signal });
    window.addEventListener('patchman:walkthrough-start', closeOverlays, { signal });
    window.addEventListener('patchman:account-modal-opened', closeOverlays, { signal });
    window.addEventListener('patchman:walkthrough-end', reopen, { signal });
    window.addEventListener(
      'beforeunload',
      (event) => {
        if (projectStore.getSnapshot().dirty) {
          event.preventDefault();
          event.returnValue = '';
        }
      },
      { signal },
    );
    document
      .getElementById('figur-menu-toggle')
      ?.addEventListener('click', () => setSidebarOpen((value) => !value), { signal });
    document.getElementById('figur-sidebar-backdrop')?.addEventListener('click', onCloseSidebar, { signal });
    document.getElementById('figur-status-pill')?.addEventListener(
      'click',
      () => {
        if (ready && projectStore.getSnapshot().project) {
          document.getElementById('file-input')?.click();
        } else if (ready) {
          setProjectsOpen(true);
        }
      },
      { signal },
    );
    document.getElementById('figur-open-projects')?.addEventListener('click', onOpenProjects, { signal });
    for (const target of ['file-input', 'open-file', 'empty-cta', 'load-test']) {
      document.getElementById(target)?.addEventListener('click', choosePhoto, { capture: true, signal });
    }
    tabs.forEach((tab) =>
      tab.addEventListener(
        'click',
        () => {
          if (!ready) {
            return;
          }
          const tool = tab.dataset.figurTab!;
          select(tool);
          projectStore.selectTool(tool);
        },
        { signal },
      ),
    );
    setHeaderActions(document.getElementById('figur-header-actions'));
    void (async () => {
      try {
        const project = await projectStore.open(id);
        if (disposed) {
          return;
        }
        const editor = await import('../src/main');
        if (disposed) {
          return;
        }
        runtime = editor.createFigurRuntime(projectStore.change, projectStore.fail);
        await runtime.restore(project?.state.portrait || null);
        if (!disposed) {
          select(project?.active_tool || 'photo');
          setReady(true);
        }
      } catch (error) {
        if (!disposed) {
          projectStore.fail(error instanceof Error ? error.message : 'The editor could not start.');
        }
      }
    })();
    return () => {
      disposed = true;
      controller.abort();
      runtime?.dispose();
    };
  }, [router.isReady, id, onCloseSidebar, onOpenProjects]);
  useEffect(() => {
    document.getElementById('panel')?.classList.toggle('mobile-open', sidebarOpen);
    document.getElementById('figur-sidebar-backdrop')?.classList.toggle('active', sidebarOpen);
    document.getElementById('figur-menu-toggle')?.setAttribute('aria-expanded', String(sidebarOpen));
  }, [sidebarOpen]);
  return { editorReady, headerActions, onCloseProjects, onOpenProjects, projectsOpen, state };
}
