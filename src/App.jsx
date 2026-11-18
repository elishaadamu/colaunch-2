import React, { useState, useEffect, createContext, useContext } from 'react'
import LaunchAuth, { isLaunchAuthenticated, logoutLaunchAuth, useLaunchAuth } from './components/launch/LaunchAuth'
import CreatorLaunchLayout from './components/launch/CreatorLaunchLayout'
import CreatorPortal from './components/launch/CreatorPortal'
import PreorderLandingPage from './components/launch/PreorderLandingPage'
import PublicConceptShowcase from './components/launch/PublicConceptShowcase'
import PublicSurveyPage from './components/launch/PublicSurveyPage'
import FollowUpCRMPage from './components/launch/FollowUpCRMPage'
import AdminErrorLogPage from './components/launch/AdminErrorLogPage'
import ProjectOSPage from './components/launch/ProjectOSPage'
import CreatorParticipationManager from './components/launch/CreatorParticipationManager'
import BetaTestingPortal from './components/launch/BetaTestingPortal'

// Re-export ForgeContext & useForge for compatibility with shared components
export const ForgeContext = createContext(null)
export function useForge() {
  const ctx = useContext(ForgeContext)
  return ctx || {
    userProfile: { username: 'admin', email: 'admin@colaunch.com', role: 'operator_admin' },
    updateAiKeys: () => {},
  }
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'))

  // Listen to browser navigation (back/forward, pushState, replaceState)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const forgeValue = {
    userProfile: { username: 'admin', email: 'admin@colaunch.com', role: 'operator_admin' },
    updateAiKeys: () => {},
  }

  // Helper to extract slug from URL pathname
  const getSlug = (prefix) => {
    if (typeof window === 'undefined') return ''
    return window.location.pathname.replace(prefix, '').replace(/\/$/, '')
  }

  // Standalone public routes (publicly viewable by external backers or survey respondents)
  if (currentPath.startsWith('/survey') || currentPath.startsWith('/research')) {
    const slug = getSlug(currentPath.startsWith('/survey') ? '/survey/' : '/research/')
    return <PublicSurveyPage slug={slug} />
  }

  if (currentPath.startsWith('/beta')) {
    const slug = getSlug('/beta/')
    return <BetaTestingPortal slug={slug} />
  }

  if (currentPath.startsWith('/concept')) {
    const slug = getSlug('/concept/')
    return <PublicConceptShowcase slug={slug} />
  }

  if (currentPath.startsWith('/preorder')) {
    const slug = getSlug('/preorder/')
    const hasConceptParam =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('concept')
    return hasConceptParam ? (
      <PublicConceptShowcase slug={slug} />
    ) : (
      <PreorderLandingPage slug={slug} />
    )
  }

  if (currentPath.startsWith('/portal/') && currentPath !== '/portal') {
    const slug = getSlug('/portal/')
    return <CreatorPortal slug={slug} />
  }

  // Operator-protected routes wrapped in LaunchAuth:
  // First page without session is the Acquisition Login (#c81e3c brand red, dark mode, border-radius 0)
  return (
    <ForgeContext.Provider value={forgeValue}>
      <LaunchAuth>
        {(() => {
          // Dedicated CRM view
          if (currentPath.startsWith('/follow-up-crm') || currentPath === '/crm') {
            return <FollowUpCRMPage />
          }

          // Dedicated Admin Error & Pipeline Exception log
          if (currentPath.startsWith('/admin-error-log') || currentPath.startsWith('/error-log') || currentPath === '/errors') {
            return <AdminErrorLogPage />
          }

          // Dedicated Project OS operations center
          if (currentPath.startsWith('/project-os') || currentPath.startsWith('/projects') || currentPath === '/project') {
            return <ProjectOSPage />
          }

          // Dedicated Creator Participation & $50 pass console
          if (
            currentPath.startsWith('/participation-manager') ||
            currentPath.startsWith('/co-builders') ||
            currentPath.startsWith('/cobuilder-admin') ||
            currentPath === '/participation'
          ) {
            return <CreatorParticipationManager />
          }

          // Creator Portal (default authenticated view)
          if (currentPath === '/portal') {
            return <CreatorPortal />
          }

          // Default root entry: Full Acquisition Engine & Launch OS Command Center
          return <CreatorLaunchLayout />
        })()}
      </LaunchAuth>
    </ForgeContext.Provider>
  )
}

