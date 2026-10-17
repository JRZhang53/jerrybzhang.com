import SwitchButton from '@/components/kokonutui/switch-button';

// Kokonut's switch flips the `dark` class; this remembers the choice across visits.
export default function ThemeToggle() {
  return (
    <SwitchButton
      showLabel={false}
      size="sm"
      aria-label="Toggle dark mode"
      onThemeChange={(theme) => {
        try {
          localStorage.setItem('theme', theme);
        } catch {}
      }}
    />
  );
}
