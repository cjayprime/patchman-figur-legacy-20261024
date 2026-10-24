const major = Number(process.versions.node.split('.')[0]);
if (!Number.isInteger(major) || major < 22) {
  console.error(
    `Patchman requires Node.js 22 or newer. You are running ${process.versions.node}. Switch to Node 22 or newer and reinstall dependencies.`,
  );
  process.exit(1);
}
