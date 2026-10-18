import SwitchButton from '@/components/kokonutui/switch-button';

// Kokonut's switch flips the `dark` class; this remembers the choice across visits.
export default function ThemeToggle() {
  return (
    <SwitchButton
      showLabel={false}
      size="sm"
      aria-label="Toggle dark mode"
      className="size-11 border-transparent bg-transparent text-muted hover:border-transparent hover:bg-line/60 hover:text-ink"
      onThemeChange={(theme) => {
        try {
          localStorage.setItem('theme', theme);
        } catch {}
      }}
    />
  );
}
