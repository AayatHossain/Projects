erDiagram
    USER ||--o{ BOOKING : places
    SERVICE_TYPE ||--o{ TRIP : categorizes
    OPERATOR ||--o{ TRIP : manages
    STATION ||--o{ TRIP : "is origin of"
    STATION ||--o{ TRIP : "is destination of"
    
    TRIP ||--o{ SEAT : contains
    TRIP ||--|| BUS_DETAILS : "specializes to"
    TRIP ||--|| FLIGHT_DETAILS : "specializes to"
    TRIP ||--|| TRAIN_DETAILS : "specializes to"
    
    BOOKING ||--|{ BOOKING_ITEM : includes
    SEAT ||--o{ BOOKING_ITEM : "is reserved in"
    BOOKING ||--|| PAYMENT : generates

    USER {
        int user_id PK
        string phone_number UK
        string name
        string email
    }

    SERVICE_TYPE {
        int type_id PK
        string type_name "Bus, Air, Train"
    }

    OPERATOR {
        int operator_id PK
        string operator_name
        string contact_info
    }

    STATION {
        int station_id PK
        string station_name
        string location_code
    }

    TRIP {
        int trip_id PK
        int type_id FK
        int operator_id FK
        int origin_id FK
        int destination_id FK
        datetime departure
        datetime arrival
        decimal base_fare
    }

    BUS_DETAILS {
        int trip_id PK, FK
        string coach_type "AC/Non-AC"
        string seat_layout "2x2, 1x2"
    }

    FLIGHT_DETAILS {
        int trip_id PK, FK
        string flight_no
        string aircraft_type
        string travel_class
    }

    TRAIN_DETAILS {
        int trip_id PK, FK
        string train_number
        string coach_class
    }

    SEAT {
        int seat_id PK
        int trip_id FK
        string seat_number
        boolean is_available
    }

    BOOKING {
        int booking_id PK
        int user_id FK
        int trip_id FK
        decimal total_amount
        string status
        datetime created_at
    }

    BOOKING_ITEM {
        int item_id PK
        int booking_id FK
        int seat_id FK
    }

    PAYMENT {
        int payment_id PK
        int booking_id FK
        string gateway "bkash, Nagad, Card"
        string transaction_id UK
        string status
    }