import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
// Typically separate this out into services for each component
export class HttpService {
  headers = new HttpHeaders().set('Content-Type', 'application/json');

  constructor(private http: HttpClient) { }
  
  // Sign up/login calls

  isUsernameTaken(username: FormControl) {
    return this.http.get(`http://localhost:3000/isUsernameTaken/${username.value}`);
  }
  
  createNewUser(username: FormControl, password: FormControl) {
    const options = {
      body: {
        user: username.value,
        pass: password.value,
      },
      json: true,
    }
    return this.http.post('http://localhost:3000/newUser', options, { headers: this.headers });
  }

  login(username: FormControl, password: FormControl) {
    const options = {
      body: {
        user: username.value,
        pass: password.value,
      },
      json: true,
    }
    return this.http.post('http://localhost:3000/login', options, { headers: this.headers });
  }

  // Restaurant search/details calls

  getNearbyRestaurants(keyword: string) {
    const options = {
      json: true,
    }
    return this.http.post(`http://localhost:3000/findrestaurants/${keyword}`, options, { headers: this.headers });
  }

  getRestaurantDetails(restaurantId: string) {
    return this.http.get(`http://localhost:3000/getdetails/${restaurantId}`);
  }

  getUserHistory(userId: string) {
    return this.http.get(`http://localhost:3000/getUserHistory/${userId}`);
  }

  getRestaurantRating(placeId: string) {
    return this.http.get(`http://localhost:3000/getRestaurantRating/${placeId}`);
  }

  rateRestaurant(userId: string, placeId: string, rating: boolean) {
    const newoptions = {
      body: {
        userId: userId,
        placeId: placeId,
        rating: rating,
      },
      json: true,
    }
    return this.http.post('http://localhost:3000/upsertThumb', newoptions, { headers: this.headers });
  }
}
