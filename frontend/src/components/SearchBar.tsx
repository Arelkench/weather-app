import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Popover from '@radix-ui/react-popover';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface Props {
  onSearch: (location: string) => void;
  currentLocation: string | null;
}

export function SearchBar({ onSearch, currentLocation }: Props) {
  const [input, setInput] = useState(currentLocation ?? '');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  // Pull recent successful forecast searches from the query cache
  const recent = queryClient
    .getQueryCache()
    .findAll({ queryKey: ['forecast'] })
    .filter((q) => q.state.status === 'success')
    .map((q) => (q.queryKey as ['forecast', string])[1])
    .filter((loc): loc is string => Boolean(loc) && loc !== currentLocation)
    .slice(0, 5);

  function submit(loc: string) {
    const trimmed = loc.trim();
    if (!trimmed) return;
    setOpen(false);
    setInput(trimmed);
    onSearch(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit(input);
    if (e.key === 'Escape') setOpen(false);
  }

  // Sync input when location changes externally
  useEffect(() => {
    if (currentLocation) setInput(currentLocation);
  }, [currentLocation]);

  return (
    <Popover.Root open={open && recent.length > 0} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          style={{ display: 'flex', gap: 8, position: 'relative' }}
        >
          <VisuallyHidden.Root>
            <label htmlFor="city-search">Search for a city or town</label>
          </VisuallyHidden.Root>
          <div style={{ position: 'relative', flex: 1 }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 16, pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              id="city-search"
              ref={inputRef}
              type="search"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setOpen(true);
              }}
              onFocus={(e) => { setOpen(true); (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
              onKeyDown={handleKeyDown}
              placeholder="Search a city or town…"
              autoComplete="off"
              aria-label="City or town"
              aria-autocomplete="list"
              aria-controls="recent-searches"
              aria-expanded={open && recent.length > 0}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />
          </div>
          <button
            type="submit"
            aria-label="Search"
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              color: '#FFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Search
          </button>
        </form>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          id="recent-searches"
          role="listbox"
          aria-label="Recent searches"
          sideOffset={4}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{
            width: 'var(--radix-popover-trigger-width)',
            minWidth: 240,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            padding: '6px 0',
            zIndex: 100,
          }}
        >
          <p style={{ padding: '4px 12px 6px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent searches
          </p>
          {recent.map((loc) => (
            <button
              key={loc}
              role="option"
              aria-selected={false}
              onClick={() => submit(loc)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: 14,
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
            >
              🕐 {loc}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
