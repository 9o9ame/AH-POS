import { useMemo, useState } from 'react';
import { AppIcon } from './AppIcon';
import {
  enabledModuleItems, moduleById, type ModuleDefinition, type ModuleId,
  type ModuleItem, type WorkspacePage,
} from './ModuleCatalog';

type Props = {
  activeModule: ModuleId;
  navigate: (page: WorkspacePage) => void;
  section: (module: ModuleId) => void;
};

export function ModuleDirectory({ activeModule, navigate, section }: Props) {
  const [query, setQuery] = useState('');
  const module = moduleById(activeModule);
  const filtered = useMemo(() => module.items.filter(item => {
    const term = query.toLowerCase().trim();
    return term === '' || (item.name + ' ' + item.description + ' ' + item.group)
      .toLowerCase().includes(term);
  }), [module, query]);
  const groups = Array.from(new Set(filtered.map(item => item.group)));
  const liveCount = enabledModuleItems(module).length;
  const allCount = module.items.length;

  function go(item: ModuleItem) {
    if (item.page) navigate(item.page);
  }

  return <div className="module-directory">
    <div className="module-directory-hero">
      <div className="module-directory-heading">
        <span className="module-hero-icon"><AppIcon name={module.icon} size={29}/></span>
        <div><span className="small-overline">AH POS / MODULE EXPLORER</span>
          <h2>{module.title}</h2>
          <p>{module.subtitle}</p></div>
      </div>
      <div className="module-directory-stats">
        <div><strong>{allCount}</strong><span>Mapped workflows</span></div>
        <div><strong>{liveCount}</strong><span>Available now</span></div>
        <div><strong>{allCount - liveCount}</strong><span>On roadmap</span></div>
      </div>
    </div>

    <div className="module-directory-toolbar">
      <label className="module-directory-search">
        <AppIcon name="search" size={17}/>
        <input aria-label={'Search '+module.title+' workflows'} value={query}
          onChange={event => setQuery(event.target.value)} placeholder="Find a module, document or operation…"/>
      </label>
      <span className="module-directory-legend">
        <i className="module-dot live"/> Available
        <i className="module-dot future"/> Planned
      </span>
    </div>

    {groups.map(group => <section className="module-directory-group" key={group}>
      <div className="module-directory-group-label"><span>{group}</span><small>{filtered.filter(item => item.group === group).length} functions</small></div>
      <div className="module-directory-grid">
        {filtered.filter(item => item.group === group).map(item => item.page
          ? <button key={item.id} type="button" className="module-entry module-entry-live"
              onClick={() => go(item)}>
              <span className="module-entry-icon"><AppIcon name={item.icon} size={20}/></span>
              <span className="module-entry-copy"><strong>{item.name}</strong><small>{item.description}</small></span>
              <span className="module-entry-state available">Open <AppIcon name="arrow" size={13}/></span>
            </button>
          : <div key={item.id} className="module-entry module-entry-planned" aria-label={item.name + ', planned'}>
              <span className="module-entry-icon"><AppIcon name={item.icon} size={20}/></span>
              <span className="module-entry-copy"><strong>{item.name}</strong><small>{item.description}</small></span>
              <span className="module-entry-state planned">Planned</span>
            </div>)}
      </div>
    </section>)}
    {filtered.length === 0 && <div className="module-no-results">No matching modules. Try a different keyword.</div>}
    <div className="module-directory-foot">
      <AppIcon name="shield" size={17}/>
      <p>This is an accurate module directory. “Available” opens an implemented local-pilot workflow.
        “Planned” is architectural scope, not an operational feature or a production-ready claim.</p>
    </div>
    <div className="module-directory-crosslinks">
      {(['definitions','daily','reports','tools','administration','help'] as ModuleId[])
        .filter(id => id !== activeModule).map(id => {
          const other = moduleById(id);
          return <button type="button" key={id} onClick={() => {section(id);setQuery('');}}>
            <AppIcon name={other.icon} size={17}/> {other.title} <AppIcon name="arrow" size={14}/>
          </button>;
        })}
    </div>
  </div>;
}

export function ModuleRibbon({
  activeModule, choose, home,
}: {
  activeModule: ModuleId;
  choose: (id: ModuleId) => void;
  home: () => void;
}) {
  return <nav className="enterprise-ribbon" aria-label="AH POS main application menu">
    <button type="button" className="ribbon-home" onClick={home} title="Business Overview">
      <AppIcon name="dashboard" size={17}/>
      <span>Home</span>
    </button>
    {(['definitions','daily','reports','tools','administration','help'] as ModuleId[])
      .map(id => {
        const module: ModuleDefinition = moduleById(id);
        return <button type="button" key={id}
          className={'ribbon-tab '+(activeModule === id ? 'ribbon-tab-active' : '')}
          aria-current={activeModule === id ? 'page' : undefined}
          onClick={() => choose(id)}>
          <AppIcon name={module.icon} size={17}/><span>{module.title}</span>
        </button>;
      })}
  </nav>;
}
