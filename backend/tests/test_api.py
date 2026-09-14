import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

@pytest.mark.asyncio
async def test_customer_login(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "john@example.com", "password": "Customer@123456"}
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "access_token" in res_data["data"]

@pytest.mark.asyncio
async def test_seller_login(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "tech@shopsphere.com", "password": "Seller@123456"}
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True

@pytest.mark.asyncio
async def test_admin_login(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@shopsphere.com", "password": "Admin@123456"}
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True

@pytest.mark.asyncio
async def test_get_products_list(async_client: AsyncClient):
    response = await async_client.get("/api/v1/products")
    assert response.status_code == 200
    res_data = response.json()
    assert "items" in res_data
    assert len(res_data["items"]) >= 1

@pytest.mark.asyncio
async def test_get_categories_list(async_client: AsyncClient):
    response = await async_client.get("/api/v1/categories")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert len(res_data["data"]) >= 1
