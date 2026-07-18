/**
 * Video section: swaps a poster image/play-button overlay for an embedded
 * YouTube/Vimeo iframe on click, so the iframe is never loaded (and never
 * autoplaying) until the visitor asks for it.
 */
function buildEmbedUrl(host, id, { autoplay, loop, muted }) {
  const params = new URLSearchParams();

  if (host === 'youtube') {
    params.set('autoplay', autoplay ? '1' : '0');
    params.set('mute', muted ? '1' : '0');
    if (loop) {
      params.set('loop', '1');
      params.set('playlist', id);
    }
    params.set('rel', '0');
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  }

  if (host === 'vimeo') {
    params.set('autoplay', autoplay ? '1' : '0');
    params.set('muted', muted ? '1' : '0');
    params.set('loop', loop ? '1' : '0');
    return `https://player.vimeo.com/video/${id}?${params.toString()}`;
  }

  return '';
}

function initVideoSection(wrapper) {
  const playButton = wrapper.querySelector('[data-video-play]');
  const player = wrapper.querySelector('[data-video-player]');
  const poster = wrapper.querySelector('[data-video-poster], .video-section__poster');
  if (!playButton || !player) return;

  const host = wrapper.dataset.videoHost;
  const id = wrapper.dataset.videoId;
  if (!host || !id) return;

  playButton.addEventListener('click', () => {
    const src = buildEmbedUrl(host, id, {
      autoplay: wrapper.dataset.autoplay === 'true',
      loop: wrapper.dataset.loop === 'true',
      muted: wrapper.dataset.muted === 'true',
    });
    if (!src) return;

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Video';
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');

    player.innerHTML = '';
    player.appendChild(iframe);
    player.hidden = false;
    if (poster) poster.hidden = true;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-video-section]').forEach(initVideoSection);
});
