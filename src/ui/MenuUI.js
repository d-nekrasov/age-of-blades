export function createTextButton(scene, { label, x, y, onClick }) {
  const button = scene.add
    .text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#f2f7ff',
      backgroundColor: '#1f2933',
      padding: { x: 14, y: 8 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  button.on('pointerover', () => button.setStyle({ backgroundColor: '#334155' }));
  button.on('pointerout', () => button.setStyle({ backgroundColor: '#1f2933' }));
  button.on('pointerdown', onClick);

  return button;
}
