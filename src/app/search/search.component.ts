import { Component } from '@angular/core';
import { HttpService } from '../http.service';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  keyword = '';
  restaurants = [];
  singleRestaurant;
  userRating: boolean;
  restaurantScore: Number;
  sentiment = 'not available.';
  userId: string;
  errorMsg: string;
  modalError: string;

  constructor(private httpService: HttpService, private modalService: ModalService) {
    this.userId = localStorage.getItem('userId');
  }

  searchRestaurants() {
    this.httpService.getNearbyRestaurants(
      // If no keyword entered, then search for food
      this.keyword.length < 1 ? 'food' : this.keyword
    ).subscribe((res: any) => {
      this.errorMsg = null;
      this.restaurants = res.results;
    }, (error) => {
      console.error(error);
      this.errorMsg = 'An error occurred and we could not find restaurants. Please try again later.';
    });
  }

  // Convert boolean from Google to useable string
  convertOpen(open: boolean) {
    if(!!open) { 
      return 'Open Now';
    } else {
      return 'Currently closed';
    }
  }

  // With more time, could add...
  // Sorting using either .map or .sort or something based on sentiment or alphabetical or nearby
  // Show photos in details
  showDetails(restaurant: any) {
    // Reset single restaurant details & sentiment & modal error msg
    this.singleRestaurant = null;
    this.modalError = null;
    this.sentiment = 'not available.';
    // Get user's rating for restaurant, if any
    this.getUserHistory(restaurant.place_id);
    // Get restaurant's score, if any
    this.getRestaurantRating(restaurant.place_id);
    this.httpService.getRestaurantDetails(restaurant.place_id).subscribe((res:any) => {
      this.assignSentiment(res.result.analytics_score);
      // Assigning response to restaurant to include previous details
      restaurant.result = res.result;
      this.singleRestaurant = restaurant;
      this.openModal('details-modal');
    }, (error) => {
      console.error(error);
      this.errorMsg = 'An error occurred retrieving this restaurant\'s details. Please try again later.';
    });
  }

  assignSentiment(score: number) {
    // Doing if instead of switch because faster computationally
    if (score > 0.3) {
      this.sentiment = 'incredible!';
    } else if (score> 0.1) {
      this.sentiment = 'well liked.';
    } else if (score > -0.1) {
      this.sentiment = 'just okay.';
    } else if (score > -0.3) {
      this.sentiment = 'not recommended.';
    } else { // score <= -0.3
      this.sentiment = 'somewhere you should stay away from.';
    }
  }

  userRated(rating: boolean) {
    // Check if the user is logged in and has already given this rating...
    if (!!this.userId && rating !== this.userRating) { 
      this.userRating = rating;
      this.httpService.rateRestaurant(this.userId, this.singleRestaurant.place_id, rating).subscribe((res:any) => {
        if(!!res.ratingFailed) {
          this.modalError = res.ratingFailed;
        }
      }, (error) => {
        console.error(error);
        this.modalError = 'An error occurred trying to submit your rating. Please try again later.';
      });
    }
  }

  /* Did not have time to finish but would make single calls to Google place details API
     unless some way to call API in bulk. Could allow user to delete using find(userid $and placeid)
     then $unset in server.js */
  getUserHistory(placeId: string) {
    // Reset user rating of restaurant before getting new
    this.userRating = null;
    // If user is logged in...
    !!this.userId ? 
      this.httpService.getUserHistory(this.userId).subscribe((res:any) => {
        // If the user has history
        if(!res.noUserHistory) {
          this.userRating = res[placeId];
        }
      }, (err) => {
        console.error(err);
        this.modalError = 'An error occurred getting your previous rating for this restaurant.';
      })
    : this.modalError = 'Please login to rate restaurants.';
  }

  getRestaurantRating(placeId: string) {
    this.restaurantScore = null;
    this.httpService.getRestaurantRating(placeId).subscribe((res:any) => {
      // If restaurant has ratings
      if(!res.noRatings) {
        this.restaurantScore = res[placeId];
      }
    }, (err) => {
      console.error(err);
      this.modalError = 'Sorry, an error occurred getting our score for this restaurant.';
    })
  }

  openModal(id: string) {
    this.modalService.open(id);
  }

  closeModal(id: string) {
      this.modalService.close(id);
  }
}
