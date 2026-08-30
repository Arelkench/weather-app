import { useState, useRef, useEffect, useId } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Popover from '@radix-ui/react-popover';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useDebounce } from '../hooks/useDebounce';
import { useLocationSuggestions } from '../hooks/useLocationSuggestions';

interface Props {
  onSearch: (location: string) => void;
  currentLocation: string | null;
}

const styles = {
  form: { display: 'flex', gap: 8 },
  inputWrapper: { position: 'relative' as const, flex: 1 },
  searchIcon: {
    position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-muted)', fontSize: 15, pointerEvents: 'none' as const,
  },
  spinner: {
    position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-muted)', fontSize: 11,
  },
  submitButton: {
    padding: '10px 20px',
    background: 'var(--accent)',
    color: '#FFF',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    fontWeight: 600 as const,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  popoverContent: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-md)',
    padding: '6px 0',
    zIndex: 100,
    minWidth: 260,
  },
  sectionLabel: {
    padding: '4px 14px 6px',
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 600 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  divider: { border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' },
  suggestionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 14px',
    border: 'none',
    textAlign: 'left' as const,
    fontSize: 14,
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
};

function inputStyle(focused: boolean) {
  return {
    width: '100%',
    padding: '10px 12px 10px 38px',
    border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
  };
}

export function SearchBar({ onSearch, currentLocation }: Props) {
  const [input, setInput] = useState(currentLocation ?? '');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const listId = useId();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [], isFetching } = useLocationSuggestions(debouncedInput);

  const recent = queryClient
    .getQueryCache()
    .findAll({ queryKey: ['forecast'] })
    .filter((q) => q.state.status === 'success')
    .map((q) => (q.queryKey as ['forecast', string])[1])
    .filter((loc): loc is string => Boolean(loc) && loc !== currentLocation)
    .slice(0, 4);

  const isTypingNewQuery = debouncedInput.trim().length >= 2 && debouncedInput !== currentLocation;
  const showRecent = recent.length > 0 && !isTypingNewQuery;
  const showSuggestions = isTypingNewQuery && suggestions.length > 0;
  const popoverOpen = open && (showRecent || showSuggestions);

  useEffect(() => {
    if (currentLocation) setInput(currentLocation);
  }, [currentLocation]);

  function submit(loc: string) {
    const trimmed = loc.trim();
    if (!trimmed) return;
    setOpen(false);
    setInput(trimmed);
    onSearch(trimmed);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    setOpen(true);
  }

  function handleFocus() {
    setFocused(true);
    setOpen(true);
  }

  function handleBlur() {
    setFocused(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit(input);
    if (e.key === 'Escape') setOpen(false);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(input);
  }

  return (
    <Popover.Root open={popoverOpen} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <form role="search" onSubmit={handleFormSubmit} style={styles.form}>
          <VisuallyHidden.Root>
            <label htmlFor="city-search">Search for a city or town</label>
          </VisuallyHidden.Root>

          <div style={styles.inputWrapper}>
            <span aria-hidden="true" style={styles.searchIcon}>🔍</span>
            {isFetching && input.trim().length >= 2 && (
              <span aria-hidden="true" style={styles.spinner}>…</span>
            )}
            <input
              id="city-search"
              ref={inputRef}
              type="search"
              value={input}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Start typing to see suggestions…"
              autoComplete="off"
              aria-label="City or town"
              aria-autocomplete="list"
              aria-controls={listId}
              aria-expanded={popoverOpen}
              style={inputStyle(focused)}
            />
          </div>

          <button type="submit" aria-label="Search" style={styles.submitButton}>
            Search
          </button>
        </form>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          sideOffset={4}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{ width: 'var(--radix-popover-trigger-width)', ...styles.popoverContent }}
        >
          {showRecent && (
            <>
              <p style={styles.sectionLabel}>Recent</p>
              {recent.map((loc) => (
                <SuggestionRow key={loc} icon="🕐" label={loc} onClick={() => submit(loc)} />
              ))}
            </>
          )}

          {showSuggestions && (
            <>
              {showRecent && <hr style={styles.divider} />}
              <p style={styles.sectionLabel}>Suggestions</p>
              {suggestions.map((s) => (
                <SuggestionRow key={s.display} icon="📍" label={s.display} onClick={() => submit(s.searchValue)} />
              ))}
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function SuggestionRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      role="option"
      aria-selected={false}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...styles.suggestionRow, background: hovered ? 'var(--bg-secondary)' : 'none' }}
    >
      <span aria-hidden="true" style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </button>
  );
}
