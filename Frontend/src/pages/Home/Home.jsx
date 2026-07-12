import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import ExploreRestaurants from '../../components/ExploreRestaurants/ExploreRestaurants'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownlaod/AppDownload'

const Home = () => {
  const [category, setCategory] = useState("All");
  const location = useLocation()

  useEffect(() => {
    if (location.state?.scrollToSection) {
      const sectionId = location.state.scrollToSection
      // Clear location state immediately to prevent repeated scrolling on page reload
      window.history.replaceState({}, document.title)
      
      const timer = setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          const offset = 80
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - offset
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [location])

  return (
    <div>
      <Header />
      <ExploreMenu category={category} setCategory={setCategory} />
      <ExploreRestaurants />
      <FoodDisplay category={category} />
      <AppDownload />
    </div>
  )
}

export default Home
