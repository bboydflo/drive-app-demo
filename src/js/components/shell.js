export default (h) => ({children}) => (
  <div class='shell'>
    {children}
    <div class='gpu-boost' />
    <a id='update-app' class='hidden' href='/sPigs.apk'>Download Link</a>
    <div class='pdf-attachment' style='position: absolute; top: -999px;' />
  </div>
);
