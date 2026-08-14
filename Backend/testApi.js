async function testApi() {
  try {
    const randomUser = `testuser_${Math.floor(Math.random() * 10000)}@test.com`;
    
    // 1. Register
    const registerRes = await fetch("https://food-ordering-6lji.onrender.com/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: randomUser,
        password: "password123",
        phone: "1234567890"
      })
    });
    const registerData = await registerRes.json();
    console.log("Register Data:", registerData);
    let token = registerData.token;

    if (!token) return;

    // 2. Place order
    const orderRes = await fetch("https://food-ordering-6lji.onrender.com/api/order/place", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        token: token
      },
      body: JSON.stringify({
        items: [{
          _id: "661413bb6978df0dc87595ab",
          name: "Pizza",
          price: 10,
          quantity: 1,
          restaurantId: "admin",
          restaurantName: "Chisto Kitchen"
        }],
        amount: 50,
        address: { street: "123", city: "City", state: "State", zip: "123", country: "US", phone: "12" },
        paymentMethod: "COD",
        isScheduled: true,
        scheduledDate: "2026-08-20",
        travelDetails: { type: "Train", pnrOrFlightNumber: "1234567890" }
      })
    });

    const orderData = await orderRes.json();
    console.log("Order API Response:", orderData);

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testApi();
