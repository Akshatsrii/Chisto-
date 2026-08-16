import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Cart from '../pages/Cart/Cart'
import { StoreContext } from '../Context/Storecontext'
import { BrowserRouter } from 'react-router-dom'

describe('Cart Component', () => {
  it('renders empty cart message when no items are present', () => {
    const mockContext = {
      cartItems: {},
      food_list: [],
      removeFromCart: vi.fn(),
      getTotalCartAmount: vi.fn().mockReturnValue(0),
      url: "http://localhost:4000"
    }

    render(
      <BrowserRouter>
        <StoreContext.Provider value={mockContext}>
          <Cart />
        </StoreContext.Provider>
      </BrowserRouter>
    )

    // Should show 0 for total
    expect(screen.getByText(/Subtotal/i)).toBeInTheDocument()
    const totals = screen.getAllByText('₹0')
    expect(totals.length).toBeGreaterThan(0)
  })

  it('renders cart items correctly', () => {
    const mockContext = {
      cartItems: { "item1": 2 },
      food_list: [
        { _id: "item1", name: "Pizza", price: 200, image: "pizza.jpg" }
      ],
      removeFromCart: vi.fn(),
      getTotalCartAmount: vi.fn().mockReturnValue(400),
      url: "http://localhost:4000"
    }

    render(
      <BrowserRouter>
        <StoreContext.Provider value={mockContext}>
          <Cart />
        </StoreContext.Provider>
      </BrowserRouter>
    )

    expect(screen.getByText('Pizza')).toBeInTheDocument()
    expect(screen.getByText('₹200')).toBeInTheDocument()
    // 2 quantities = 400 total. Can appear in item total and subtotal.
    expect(screen.getAllByText('₹400').length).toBeGreaterThan(0)
  })
})
