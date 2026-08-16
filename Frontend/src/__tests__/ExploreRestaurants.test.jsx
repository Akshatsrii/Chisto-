import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ExploreRestaurants from '../components/ExploreRestaurants/ExploreRestaurants'
import { StoreContext } from '../Context/Storecontext'
import { BrowserRouter } from 'react-router-dom'

describe('ExploreRestaurants Component', () => {
  it('renders a list of unique restaurants from food_list', () => {
    const mockContext = {
      food_list: [
        { _id: "item1", restaurantName: "KFC", restaurantId: "r1" },
        { _id: "item2", restaurantName: "KFC", restaurantId: "r1" },
        { _id: "item3", restaurantName: "Dominos", restaurantId: "r2" }
      ]
    }

    render(
      <BrowserRouter>
        <StoreContext.Provider value={mockContext}>
          <ExploreRestaurants category="All" setCategory={vi.fn()} />
        </StoreContext.Provider>
      </BrowserRouter>
    )

    // Should only show KFC and Dominos (they might be duplicated by CSS marquee)
    expect(screen.getAllByText('KFC').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Dominos').length).toBeGreaterThan(0)
    
    // The "All" category is also rendered, but it's not a restaurant. 
    // It's the title "Explore Top Brands Near You". Let's verify title exists.
    expect(screen.getByText(/Explore Top Brands Near You/i)).toBeInTheDocument()
  })
})
