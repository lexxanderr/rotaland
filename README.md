# RotaLand

A modern workforce scheduling and shift operations platform for building rotas, managing teams, handling time-off requests, and organising department-level staffing.

RotaLand is an active full-stack project built as an evolution of a postgraduate workforce scheduling concept inspired by real operational challenges encountered in retail.

## Overview

Workforce scheduling becomes increasingly difficult as teams grow across departments, contracts, shifts, availability, and leave.

RotaLand is designed to give managers a clearer operational view of their workforce while giving employees a simple way to understand and manage their working schedule.

The current release focuses on the manager experience.

## Current Features

### Weekly Rota
- Create, edit and delete employee shifts
- Configure shift start/end times and breaks
- Navigate between rota weeks
- Department-level weekly rota views
- Store-wide staffing overview
- Publish and amend rotas
- Rota publication versioning
- Weekly scheduled-hours statistics
- Responsive desktop and mobile workflows

### People
- Department-based workforce management
- Add and edit employees
- Assign roles and contracted weekly hours
- Assign employees to departments
- Deactivate and reactivate employees
- Department and employee drill-down views

### Time-Off Requests
- Create employee time-off requests
- Review pending requests
- Approve or reject requests
- Track request status and review information

## Technology

**Backend:** C#, ASP.NET Core Web API, Entity Framework Core, PostgreSQL, REST APIs

**Frontend:** React, TypeScript, Vite, Lucide React

**Testing:** xUnit

## Architecture

RotaLand currently follows a modular full-stack architecture with the workforce hierarchy:

**Organisation → Location → Department → Employee**

Scheduling, employee management, time-off requests and rota publication are handled through the ASP.NET Core API, with PostgreSQL persistence through Entity Framework Core.

## Current Status

**Active Development**

The manager-facing MVP is operational. Current development is moving toward scheduling intelligence and the employee-facing experience.

## Roadmap

- Contracted vs scheduled hours
- Scheduling conflict detection
- Approved-leave conflict warnings
- Department coverage indicators
- Authentication and role-based access
- Employee portal
- Employee availability
- Shift swap requests
- Production deployment

## Product Background

RotaLand originated from a postgraduate scheduling project exploring a real workforce-planning problem observed in retail operations.

The current version is a ground-up full-stack rebuild focused on stronger architecture, scalable department-based scheduling, responsive workflows, and practical workforce operations.

## Repository Structure

- `src/RotaLand.Api` — ASP.NET Core API
- `tests/RotaLand.Api.Tests` — automated tests
- `client` — React + TypeScript frontend

## Development

RotaLand is currently under active development. Production deployment and public demo access are planned as the project progresses.

---

Built by Alexander Iskandar.
