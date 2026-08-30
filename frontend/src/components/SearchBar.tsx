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

export function SearchBar({ onSearch, currentLocation }: Props) {
  const [input, setInput] = useState(currentLocation ?? '');
  const [open, setOpen] = useState(false);
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

  // User is actively typing a new query when input differs from the loaded location
  // and has enough chars to warrant suggestions.
  const isTypingNewQuery = debouncedInput.trim().length >= 2 && debouncedInput !== currentLocation;
  const showRecent = recent.length > 0 && !isTypingNewQuery;
  const showSuggestions = isTypingNewQuery && suggestions.length > 0;
  const popoverOpen = open && (showRecent || showSuggestions);

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

  useEffect(() => {
    if (currentLocation) setInput(currentLocation);
  }, [currentLocation]);

  return (
    <Popover.Root open={popoverOpen} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          style={{ display: 'flex', gap: 8 }}
        >
          <VisuallyHidden.Root>
            <label htmlFor="city-search">Search for a city or town</label>
          </VisuallyHidden.Root>

          <div style={{ position: 'relative', flex: 1 }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 15, pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            {isFetching && input.trim().length >= 2 && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 11,
                }}
              >
                …
              </span>
            )}
            <input
              id="city-search"
              ref={inputRef}
              type="search"
              value={input}
              onChange={(e) => { setInput(e.target.value); setOpen(true); }}
              onFocus={(e) => {
                setOpen(true);
                (e.target as HTMLInputElement).style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Start typing to see suggestions…"
              autoComplete="off"
              aria-label="City or town"
              aria-autocomplete="list"
              aria-controls={listId}
              aria-expanded={popoverOpen}
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
              flexShrink: 0,
            }}
          >
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
          style={{
            width: 'var(--radix-popover-trigger-width)',
            minWidth: 260,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            padding: '6px 0',
            zIndex: 100,
          }}
        >
          {/* Recent searches */}
          {showRecent && (
            <>
              <p style={{
                padding: '4px 14px 6px',
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Recent
              </p>
              {recent.map((loc) => (
                <SuggestionRow
                  key={loc}
                  icon="🕐"
                  label={loc}
                  onClick={() => submit(loc)}
                />
              ))}
            </>
          )}

          {/* Live suggestions */}
          {showSuggestions && (
            <>
              {showRecent && <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />}
              <p style={{
                padding: '4px 14px 6px',
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Suggestions
              </p>
              {suggestions.map((s) => (
                <SuggestionRow
                  key={s.display}
                  icon="📍"
                  label={s.display}
                  onClick={() => submit(s.searchValue)}
                />
              ))}
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function SuggestionRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      role="option"
      aria-selected={false}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 14px',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        fontSize: 14,
        color: 'var(--text-primary)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      <span aria-hidden="true" style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </button>
  );
}
