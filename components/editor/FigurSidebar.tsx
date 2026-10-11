export function FigurSidebar() {
  return (
    <>
      <aside id="panel" aria-label="Editing controls">
        <nav className="studio-nav-tabs" aria-label="Editing sections">
          <button className="studio-tab-btn active" type="button" data-figur-tab="photo" aria-pressed="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M4 5h3l1.5-2h7L17 5h3a2 2 0 0 1 2 2v12H2V7a2 2 0 0 1 2-2m8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
              />
            </svg>
            <span>PHOTO</span>
          </button>
          <button className="studio-tab-btn" type="button" data-figur-tab="shape" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7 3h2v2h6V3h2v2h3v2h-3v10h3v2h-3v2h-2v-2H9v2H7v-2H4v-2h3V7H4V5h3V3m2 4v10h6V7H9Z"
              />
            </svg>
            <span>SHAPE</span>
          </button>
          <button className="studio-tab-btn" type="button" data-figur-tab="compare" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 3v18H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8m2 0h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6v-2h6V5h-6V3Z"
              />
            </svg>
            <span>COMPARE</span>
          </button>
          <button className="studio-tab-btn" type="button" data-figur-tab="projects" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M3 5h7l2 2h9v12H3V5m2 4v8h14V9H5Z" />
            </svg>
            <span>PROJECTS</span>
          </button>
          <button className="studio-tab-btn" type="button" data-figur-tab="advanced" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M4 7h10v2H4V7m0 8h6v2H4v-2m14-4h2v6h-2v-2h-4v-2h4v-2M16 3h2v6h-2V7h-4V5h4V3M12 13h2v6h-2v-2h-2v-2h2v-2Z"
              />
            </svg>
            <span>ADVANCED</span>
          </button>
        </nav>
        <div className="panel-scroll">
          <section className="panel-section" data-figur-panel="photo">
            <div className="feature-card photo-upload-card">
              <div className="feature-card-art" aria-hidden="true">
                <svg viewBox="0 0 132 112">
                  <path d="M18 49h22l8-12h38l8 12h20l9 47H9l9-47Z" fill="#fff" stroke="#2b2430" strokeWidth="3" />
                  <rect
                    x="39"
                    y="12"
                    width="54"
                    height="61"
                    rx="6"
                    fill="#fff8fb"
                    stroke="#2b2430"
                    strokeWidth="3"
                    transform="rotate(-8 39 12)"
                  />
                  <circle cx="68" cy="42" r="13" fill="#f45b9c" />
                  <path d="M49 67c4-14 11-21 21-21 11 0 18 7 22 21" fill="#e83e8c" />
                  <path
                    d="M66 91V64m0 0-11 12m11-12 11 12"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="feature-card-copy">
                <p className="panel-kicker">FROM YOUR DEVICE</p>
                <h2 className="panel-heading">Upload A Portrait</h2>
                <p className="panel-description">Choose a JPG, PNG, or WEBP, or drop it onto the canvas.</p>
                <button id="open-file" type="button" className="btn btn-primary">
                  CHOOSE A PHOTO
                </button>
              </div>
            </div>
            <div className="privacy-ribbon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2 20 5v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5l8-3m0 4a3 3 0 0 0-3 3v2H8v6h8v-6h-1V9a3 3 0 0 0-3-3m0 2a1 1 0 0 1 1 1v2h-2V9a1 1 0 0 1 1-1Z"
                />
              </svg>
              <div>
                <strong>Your portrait stays yours.</strong>
                <span>Editing runs locally in this browser.</span>
              </div>
            </div>
            <div className="format-chips" aria-label="Supported formats">
              <span>JPG</span>
              <span>PNG</span>
              <span>WEBP</span>
              <span>DROP TO UPLOAD</span>
            </div>
            <input id="file-input" type="file" accept="image/*" hidden />
          </section>

          <section className="panel-section" data-figur-panel="projects" hidden>
            <div className="panel-visual-heading projects-visual-heading">
              <div className="panel-visual-art" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <path d="M18 29h33l9 10h42v58H18V29Z" fill="#ffd2e4" stroke="#b82669" strokeWidth="3" />
                  <rect x="31" y="48" width="57" height="37" rx="4" fill="#fff" stroke="#e83e8c" strokeWidth="3" />
                  <circle cx="48" cy="61" r="7" fill="#f45b9c" />
                  <path d="m38 78 13-12 9 8 9-9 12 13" fill="none" stroke="#b82669" strokeWidth="3" />
                </svg>
              </div>
              <div>
                <p className="panel-kicker">YOUR CREATIVE ARCHIVE</p>
                <h2 className="panel-heading">Projects</h2>
                <p className="panel-description">
                  Open a portrait session or create a fresh direction without leaving this tab.
                </p>
              </div>
            </div>
            <button id="figur-open-projects" type="button" className="btn btn-primary">
              CREATE OR OPEN A PROJECT
            </button>
          </section>

          <section className="panel-section" data-figur-panel="shape" hidden>
            <div className="panel-visual-heading shape-visual-heading">
              <div className="panel-visual-art" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <path
                    d="M46 16c1 12-5 18-10 27-6 11-4 22 2 29 6 8 7 19 5 32h34c-2-13-1-24 5-32 6-7 8-18 2-29-5-9-11-15-10-27"
                    fill="#ffd2e4"
                    stroke="#b82669"
                    strokeWidth="3"
                  />
                  <path
                    d="M44 48c10 7 22 7 32 0M42 74c12-8 24-8 36 0"
                    fill="none"
                    stroke="#e83e8c"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <g fill="#fff" stroke="#e83e8c" strokeWidth="3">
                    <circle cx="43" cy="49" r="5" />
                    <circle cx="77" cy="49" r="5" />
                    <circle cx="41" cy="74" r="5" />
                    <circle cx="79" cy="74" r="5" />
                  </g>
                </svg>
              </div>
              <div>
                <p className="panel-kicker">SCULPT WITH CONTROL</p>
                <h2 className="panel-heading">Shape The Silhouette</h2>
                <p className="panel-description">
                  Start with body-aware sliders, then place points on the portrait for exact local changes.
                </p>
              </div>
            </div>
            <div className="canvas-tip">
              <strong>ON THE CANVAS</strong>
              <span>Click to shape • Shift-click to pin • Drag to refine</span>
            </div>

            <div className="srow">
              <div className="slider">
                <span className="slider-head">
                  <label htmlFor="s-waist">Waist</label>
                  <input
                    id="s-waist-val"
                    className="num-input"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="0"
                    aria-label="Waist amount"
                  />
                </span>
                <input id="s-waist" type="range" min="0" max="100" step="1" defaultValue="0" />
              </div>
              <button className="mini" id="s-waist-reset" type="button" aria-label="Reset waist">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M12 5V2L7 7l5 5V9a5 5 0 1 1-5 5H5a7 7 0 1 0 7-9Z" />
                </svg>
              </button>
            </div>

            <div className="srow">
              <div className="slider">
                <span className="slider-head">
                  <label htmlFor="s-hips">Hips</label>
                  <input
                    id="s-hips-val"
                    className="num-input"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="0"
                    aria-label="Hips amount"
                  />
                </span>
                <input id="s-hips" type="range" min="0" max="100" step="1" defaultValue="0" />
              </div>
              <button className="mini" id="s-hips-reset" type="button" aria-label="Reset hips">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M12 5V2L7 7l5 5V9a5 5 0 1 1-5 5H5a7 7 0 1 0 7-9Z" />
                </svg>
              </button>
            </div>

            <div className="srow">
              <div className="slider">
                <span className="slider-head">
                  <label htmlFor="s-bust">Bust</label>
                  <input
                    id="s-bust-val"
                    className="num-input"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="0"
                    aria-label="Bust amount"
                  />
                </span>
                <input id="s-bust" type="range" min="0" max="100" step="1" defaultValue="0" />
              </div>
              <button className="mini" id="s-bust-reset" type="button" aria-label="Reset bust">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M12 5V2L7 7l5 5V9a5 5 0 1 1-5 5H5a7 7 0 1 0 7-9Z" />
                </svg>
              </button>
            </div>

            <div className="srow">
              <div className="slider">
                <span className="slider-head">
                  <label htmlFor="s-bbl">Curve</label>
                  <input
                    id="s-bbl-val"
                    className="num-input"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="0"
                    aria-label="Curve amount"
                  />
                </span>
                <input id="s-bbl" type="range" min="0" max="100" step="1" defaultValue="0" />
              </div>
              <button className="mini" id="s-bbl-reset" type="button" aria-label="Reset curve">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M12 5V2L7 7l5 5V9a5 5 0 1 1-5 5H5a7 7 0 1 0 7-9Z" />
                </svg>
              </button>
            </div>
          </section>

          <section className="panel-section" data-figur-panel="compare" hidden>
            <div className="compare-visual" aria-hidden="true">
              <div className="compare-half compare-before">
                <span>BEFORE</span>
                <svg viewBox="0 0 90 120">
                  <circle cx="45" cy="30" r="18" />
                  <path d="M18 108c3-40 12-61 27-61s24 21 27 61Z" />
                </svg>
              </div>
              <div className="compare-half compare-after">
                <span>AFTER</span>
                <svg viewBox="0 0 90 120">
                  <circle cx="45" cy="30" r="18" />
                  <path d="M13 108c6-43 17-61 32-61s26 18 32 61Z" />
                </svg>
              </div>
              <div className="compare-divider">
                <span>↔</span>
              </div>
            </div>
            <div>
              <p className="panel-kicker">BEFORE &amp; AFTER</p>
              <h2 className="panel-heading">See The Difference</h2>
              <p className="panel-description">
                Reveal the untouched portrait at any moment or inspect both versions together.
              </p>
            </div>
            <button id="hold-compare" type="button" className="btn btn-primary btn-block compare-action">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                />
              </svg>
              <span>HOLD TO SEE ORIGINAL</span>
            </button>
            <label className="check compare-toggle-card">
              <input id="split" type="checkbox" />
              <span>
                <strong>Side By Side</strong>
                <small>Drag the divider across the portrait.</small>
              </span>
            </label>
            <div className="compare-position-card">
              <div className="compare-position-heading">
                <div>
                  <strong>Divider Position</strong>
                  <span>Choose where the original ends and your edit begins.</span>
                </div>
                <output id="split-ratio-value" htmlFor="split-ratio">
                  50%
                </output>
              </div>
              <input
                id="split-ratio"
                type="range"
                min="10"
                max="90"
                step="1"
                defaultValue="50"
                aria-label="Divider Position"
              />
              <button id="split-reset" type="button" className="btn btn-soft btn-block">
                CENTER DIVIDER
              </button>
            </div>
            <div className="compare-tips-grid" aria-label="Comparison controls">
              <div>
                <kbd>SPACE</kbd>
                <strong>Quick Reveal</strong>
                <span>Hold while editing to check the original.</span>
              </div>
              <div>
                <span className="compare-tip-icon" aria-hidden="true">
                  ↔
                </span>
                <strong>Drag To Inspect</strong>
                <span>Move the divider across important details.</span>
              </div>
            </div>
          </section>

          <section className="advanced-panel" data-figur-panel="advanced" hidden>
            <div className="panel-visual-heading advanced-visual-heading">
              <div className="panel-visual-art" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="43" fill="#ffd7e8" stroke="#b82669" strokeWidth="3" />
                  <path d="M35 44h50M35 60h50M35 76h50" stroke="#b82669" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="51" cy="44" r="7" fill="#fff" stroke="#e83e8c" strokeWidth="3" />
                  <circle cx="72" cy="60" r="7" fill="#fff" stroke="#e83e8c" strokeWidth="3" />
                  <circle cx="44" cy="76" r="7" fill="#fff" stroke="#e83e8c" strokeWidth="3" />
                </svg>
              </div>
              <div>
                <p className="panel-kicker">PRECISION LAB</p>
                <h2 className="panel-heading">Advanced Controls</h2>
                <p className="panel-description">
                  Tune the shaping engine, body intelligence, overlays, and canvas diagnostics.
                </p>
              </div>
            </div>
            <div className="advanced-grid">
              <section className="advanced-option">
                <div className="list-head">
                  <span>Photo Source</span>
                </div>
                <button id="load-test" type="button" className="btn btn-soft btn-block" aria-pressed="false">
                  LOAD TEST PATTERN
                </button>
              </section>

              <section className="advanced-option">
                <div className="list-head">
                  <span>Slider Ceiling</span>
                </div>
                <input
                  id="slider-ceiling"
                  className="num-input num-input-wide"
                  type="number"
                  min="10"
                  max="2000"
                  defaultValue="100"
                  aria-label="Maximum slider value"
                />
              </section>

              <section className="advanced-option advanced-option-wide">
                <div className="list-head">
                  <span>
                    Manual Warp <em className="tag">M1</em>
                  </span>
                </div>
                <div className="slider">
                  <span className="slider-head">
                    <label htmlFor="alpha">Alpha</label>
                    <input
                      id="alpha-val"
                      className="num-input"
                      type="number"
                      min="0.2"
                      max="3"
                      step="0.05"
                      defaultValue="1.2"
                      aria-label="Alpha value"
                    />
                  </span>
                  <input id="alpha" type="range" min="0.2" max="3" step="0.05" defaultValue="1.2" />
                </div>
                <div className="slider">
                  <span className="slider-head">
                    <label htmlFor="radius">Radius %</label>
                    <input
                      id="radius-val"
                      className="num-input"
                      type="number"
                      min="5"
                      max="100"
                      step="1"
                      defaultValue="30"
                      aria-label="Radius percentage"
                    />
                  </span>
                  <input id="radius" type="range" min="5" max="100" step="1" defaultValue="30" />
                </div>
                <label className="check">
                  <input id="localize" type="checkbox" defaultChecked />
                  <span>Localize Edits (Bounded Support)</span>
                </label>
              </section>

              <section className="advanced-option">
                <div className="list-head">
                  <span>Overlays</span>
                </div>
                <label className="check">
                  <input id="wireframe" type="checkbox" />
                  <span>Mesh wireframe</span>
                </label>
                <label className="check">
                  <input id="show-cp" type="checkbox" defaultChecked />
                  <span>Control points</span>
                </label>
              </section>

              <section className="advanced-option advanced-option-wide">
                <div className="list-head">
                  <span>
                    Body Intelligence <em className="tag">M2</em>
                  </span>
                </div>
                <div className="field">
                  <label htmlFor="seg-model">Segmentation Model</label>
                  <select id="seg-model">
                    <option value="multiclass">Multiclass (union)</option>
                    <option value="selfie">Selfie (single-class)</option>
                  </select>
                </div>
                <label className="check">
                  <input id="show-matte" type="checkbox" />
                  <span>Matte Tint (Red 40%)</span>
                </label>
                <label className="check">
                  <input id="show-pose" type="checkbox" />
                  <span>Pose Landmarks + Skeleton</span>
                </label>
                <label className="check">
                  <input id="show-contour" type="checkbox" />
                  <span>Contour Points (Bust/Waist/Hip)</span>
                </label>
                <button id="redetect" type="button" className="btn btn-soft btn-block">
                  Re-Detect
                </button>
                <p id="detect-status" className="status">
                  Models: loading
                </p>
              </section>

              <section className="advanced-option">
                <div className="list-head">
                  <span>
                    Performance <em className="tag">M3</em>
                  </span>
                </div>
                <div id="hud">
                  <span id="fps">0 fps</span>
                  <span id="mls-ms"></span>
                </div>
              </section>

              <section className="advanced-option">
                <div className="list-head">
                  <span>Canvas</span>
                </div>
                <div className="row">
                  <button id="reset-view" type="button" className="btn btn-soft">
                    Reset View
                  </button>
                  <button id="clear" type="button" className="btn btn-soft">
                    Clear Points
                  </button>
                </div>
              </section>

              <section className="advanced-option advanced-option-wide">
                <div className="list-head">
                  <span>
                    Points <em id="cp-count">0 / 40</em>
                  </span>
                </div>
                <div id="points-list"></div>
              </section>

              <section className="advanced-option advanced-option-wide">
                <div className="list-head">
                  <span>Keyboard Shortcuts</span>
                </div>
                <div className="shortcuts-list">
                  <div className="shortcut-item">
                    <div className="keys">
                      <kbd>Click</kbd>
                    </div>{' '}
                    <span>Add shaping point</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="keys">
                      <kbd>Shift</kbd> + <kbd>Click</kbd>
                    </div>{' '}
                    <span>Add anchor pin</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="keys">
                      <kbd>Del</kbd>
                    </div>{' '}
                    <span>Delete selected</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="keys">
                      <kbd>Space</kbd>
                    </div>{' '}
                    <span>Hold to compare</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="keys">
                      <kbd>Scroll</kbd>
                    </div>{' '}
                    <span>Zoom in / out</span>
                  </div>
                  <div className="shortcut-item">
                    <div className="keys">
                      <kbd>Drag</kbd>
                    </div>{' '}
                    <span>Pan photo</span>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>

        <div className="panel-footer">
          <button id="download" type="button" className="btn btn-primary btn-block">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
            </svg>
            <span>DOWNLOAD PHOTO</span>
          </button>
          <p className="panel-footnote">Your photo. Your control.</p>
        </div>
      </aside>
    </>
  );
}
