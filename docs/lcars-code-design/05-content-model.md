# The content model

The content is data; the templates know nothing about the facts. One table,
`content/home-table.json`, holds every string of the site in both languages,
next to the limits it must respect.

## The table

`slots` is a map of groups. A group is a list of entries; an entry has an
`id` and its fields. The groups:

| group | what it holds |
|---|---|
| `top.identity` | the name, the role, the lead, the section titles |
| `top.pills` | the figures that go into the metrics |
| `top.cascade` | the labels of the live readout cells |
| `left.status` | the availability, the place, the shift |
| `left.facts` | the short facts |
| `left.chrome` | the nav labels and the language label |
| `mid.services` | the three directions |
| `mid.projects` | the fourteen cases |
| `mid.record` | the record |
| `bottom.more` | the other links |
| `page.about` | the three paragraphs |

`sections` is a separate map: for each page, the list of the sections, their
labels and how many rows each carries. The spine is generated from it.

## A project entry

```
id, slug, title{en,ru}, subtitle, summary, problem, approach,
stack, status, confidentiality, theme, accent,
results[{value, label{en,ru}}], links[{label, url}], images[{src, thumb, alt{en,ru}}],
limit_title, limit_summary, limit_metric_label, limit_metric_value,
limit_problem, limit_approach
```

Adding a case is one entry in `mid.projects` - the page, the spine block,
the theme and the gallery are generated from it. Nothing in a template
changes.

## The two languages

Every text field is `{en, ru}` and both are required. The URL decides the
language: the root is English, `/ru/` is Russian. The switch remembers the
choice in `localStorage` and sends the visitor to the counterpart path, so
the URL always follows the stored preference.

## The limits

Each entry declares the maximum length of its own fields (`limit_title`,
`limit_summary`, `limit_metric_value`, `limit_problem`, `limit_approach`).
`scripts/validate_slots.py` fails the build when a string is longer than its
limit, when a language is missing, when an image file is missing, or when a
forbidden claim appears in the table.

The limits are not decoration: they are what keeps a long sentence from
becoming a wall of text, and what keeps a label from breaking the geometry
of the block it sits in.

## The page recipes

**Home** - the lead, then five sections: what I build (3 rows), the work
(3 rows), the record (3 rows), the facts (5 rows + 3 metrics), the links
(2 rows).

**Work** - one list of the fourteen cases: the headline number, the name as
a link, the subtitle, the slug.

**Case** - the name, the gallery, then four sections: the problem, the
approach, the measured results, the stack and the source. The problem and
the approach are split into sentences and each sentence becomes a row.

**About** - the lead, then three sections: about (the three paragraphs, split
into sentences), the record, the facts.

**Contact** - the lead, the actions, the facts.
