import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithGds } from '../../../test-utils/render';
import { SidebarNav, SidebarNavItem, SidebarNavSection } from './SidebarNav';

function NestedNav(props: { defaultOpened?: boolean }) {
  return (
    <SidebarNav>
      <SidebarNavSection label="Workspace">
        <SidebarNavItem href="/home" label="Home" active />
        <SidebarNavItem label="Reports" defaultOpened={props.defaultOpened}>
          <SidebarNavItem href="/reports/weekly" label="Weekly" />
          <SidebarNavItem href="/reports/monthly" label="Monthly" />
        </SidebarNavItem>
      </SidebarNavSection>
    </SidebarNav>
  );
}

describe('SidebarNavItem nested items (#955)', () => {
  it('a parent with children is a disclosure button with aria-expanded', () => {
    renderWithGds(<NestedNav />);
    const parent = screen.getByRole('button', { name: 'Reports' });
    expect(parent.tagName).toBe('BUTTON');
    expect(parent.getAttribute('type')).toBe('button');
    expect(parent.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(parent);
    expect(parent.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(parent);
    expect(parent.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles with Space from the keyboard and starts open with defaultOpened', () => {
    renderWithGds(<NestedNav defaultOpened />);
    const parent = screen.getByRole('button', { name: 'Reports' });
    expect(parent.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(parent, { key: ' ', code: 'Space' });
    expect(parent.getAttribute('aria-expanded')).toBe('false');
  });

  it('indents children from the spacing token, and a leaf stays a link with aria-current', () => {
    const { container } = renderWithGds(<NestedNav defaultOpened />);
    const childrenBox = container.querySelector<HTMLElement>('.mantine-NavLink-children');
    expect(childrenBox?.getAttribute('style') ?? '').toContain('--nl-offset: var(--gds-space-md)');
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home.getAttribute('aria-current')).toBe('page');
    expect(home.classList.contains('gds-navlink')).toBe(true);
    expect(container.querySelectorAll('a.gds-navlink[href^="/reports/"]')).toHaveLength(2);
  });
});
