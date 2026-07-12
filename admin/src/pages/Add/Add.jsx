import React, { useState } from 'react'
import './Add.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const Add = () => {

  const url = "https://food-ordering-6lji.onrender.com"

  const [image, setImage] = useState(false)

  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad"
  })

  // INPUT CHANGE HANDLER
  const onChangeHandler = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  // IMAGE HANDLER
  const imageHandler = (e) => {
    setImage(e.target.files[0])
  }

  // SUBMIT HANDLER
  const onSubmitHandler = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("description", data.description)
    formData.append("price", Number(data.price))
    formData.append("category", data.category)
    formData.append("image", image)

    try {
      const token = localStorage.getItem("admin-token")
      const response = await axios.post(
        `${url}/api/food/add`,
        formData,
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success(response.data.message || "Food Added Successfully")

        setData({
          name: "",
          description: "",
          price: "",
          category: "Salad"
        })
        setImage(false)
      } else {
        toast.error(response.data.message || "Error adding food")
      }

    } catch (error) {
      console.log(error)
      toast.error("Server Error")
    }
  }

  return (
    <div className="add">
      <form className="flex-col" onSubmit={onSubmitHandler}>

        {/* IMAGE UPLOAD */}
        <div className="add-img-upload flex-col">
          <p>Upload Image</p>
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            type="file"
            id="image"
            hidden
            required
            onChange={imageHandler}
          />
        </div>

        {/* PRODUCT NAME */}
        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input
            type="text"
            name="name"
            value={data.name}
            onChange={onChangeHandler}
            placeholder="Type here"
            required
          />
        </div>

        {/* PRODUCT DESCRIPTION */}
        <div className="add-product-description flex-col">
          <p>Product description</p>
          <textarea
            name="description"
            value={data.description}
            onChange={onChangeHandler}
            rows="6"
            placeholder="Write content here"
            required
          ></textarea>
        </div>

        {/* CATEGORY & PRICE */}
        <div className="add-category-price">

          <div className="add-category flex-col">
            <p>Product category</p>
            <select
              name="category"
              value={data.category}
              onChange={onChangeHandler}
            >
              <option value="Salad">Salad</option>
              <option value="Rolls">Rolls</option>
              <option value="Deserts">Deserts</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Cake">Cake</option>
              <option value="Pure Veg">Pure Veg</option>
              <option value="Pasta">Pasta</option>
              <option value="Noodles">Noodles</option>
            </select>
          </div>

          <div className="add-price flex-col">
            <p>Product price</p>
            <input
              type="number"
              name="price"
              value={data.price}
              onChange={onChangeHandler}
              placeholder="$20"
              required
            />
          </div>

        </div>

        {/* SUBMIT BUTTON */}
        <button type="submit" className="add-btn">
          ADD
        </button>

      </form>
    </div>
  )
}

export default Add
